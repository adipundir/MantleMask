// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./interfaces/IMerkleTreeWithHistory.sol";
import "./MerkleTreeWithHistory.sol";

/**
 * @title MantleMask
 * @dev Privacy-focused contract for anonymous native MNT transfers on Mantle Network
 * Uses zero-knowledge proofs and Merkle trees to ensure transaction privacy
 */
contract MantleMask is ReentrancyGuard, Ownable {
    // Events
    event Deposit(bytes32 indexed commitment, uint256 denomination, uint256 leafIndex, uint256 timestamp);
    event Withdrawal(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee, uint256 denomination);
    
    // State variables
    IMerkleTreeWithHistory public merkleTree;
    
    // Mapping to track spent nullifiers (prevents double-spending)
    mapping(bytes32 => bool) public nullifierHashes;
    
    // Allowed denominations for deposits
    uint256[] public allowedDenominations;
    
    // Map to check if a denomination is allowed
    mapping(uint256 => bool) public isDenominationAllowed;
    
    // Verifier contract for ZK proofs
    address public verifier;
    
    // Map nullifierHash to its denomination
    mapping(bytes32 => uint256) public nullifierToDenomination;
    
    /**
     * @dev Constructor initializes the contract with parameters
     * @param _merkleTreeHeight Height of the Merkle tree (determines max deposits)
     * @param _verifier Address of the ZK proof verifier contract
     */
    constructor(
        uint32 _merkleTreeHeight,
        address _verifier
    ) Ownable(msg.sender) {
        require(_verifier != address(0), "Verifier address cannot be zero");
        
        verifier = _verifier;
        
        // Initialize the Merkle tree
        merkleTree = new MerkleTreeWithHistory(_merkleTreeHeight);
        
        // Set allowed denominations (in MNT - 10, 100, 500, 1000)
        allowedDenominations = [
            10 ether,
            100 ether,
            500 ether,
            1000 ether
        ];
        
        // Mark denominations as allowed in the mapping
        for (uint i = 0; i < allowedDenominations.length; i++) {
            isDenominationAllowed[allowedDenominations[i]] = true;
        }
    }
    
    /**
     * @dev Deposit function - user deposits native MNT and adds commitment to Merkle tree
     * @param _commitment The commitment hash (derived from nullifier and secret)
     * Note: The commitment is a Poseidon hash of (nullifier, secret) generated client-side
     */
    function deposit(bytes32 _commitment) external payable nonReentrant {
        // Check that the sent amount matches one of the allowed denominations
        require(isDenominationAllowed[msg.value], "Deposit amount must be exactly 10, 100, 500, or 1000 MNT");
        
        // Insert the commitment into the Merkle tree
        uint256 leafIndex = merkleTree.insert(_commitment);
        
        // Map commitment to denomination for later verification
        nullifierToDenomination[_commitment] = msg.value;
        
        emit Deposit(_commitment, msg.value, leafIndex, block.timestamp);
    }
    
    /**
     * @dev Withdraw function - verifies ZK proof and sends native MNT to recipient
     * @param _proof ZK proof data
     * @param _root Merkle root
     * @param _nullifierHash Hash of nullifier to prevent double-spending
     * @param _recipient Address to receive the withdrawn tokens
     * @param _relayer Address of relayer (for optional relayer fees)
     * @param _fee Fee paid to relayer (0 if no relayer used)
     * @param _denomination The denomination of the note being withdrawn
     */
    function withdraw(
        bytes calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        address payable _recipient,
        address payable _relayer,
        uint256 _fee,
        uint256 _denomination
    ) external nonReentrant {
        require(isDenominationAllowed[_denomination], "Invalid denomination");
        require(_fee <= _denomination, "Fee exceeds denomination");
        require(!nullifierHashes[_nullifierHash], "Note has been already spent");
        require(merkleTree.isKnownRoot(_root), "Invalid Merkle root");
        require(_recipient != address(0), "Cannot withdraw to zero address");
        
        // Verify that _root is one of the last MERKLE_TREE_HISTORY_SIZE roots
        require(verifyProof(_proof, _root, _nullifierHash), "Invalid proof");
        
        // Mark nullifier as spent
        nullifierHashes[_nullifierHash] = true;
        
        // Calculate amount after fee
        uint256 amount = _denomination - _fee;
        
        // Transfer native MNT to recipient
        (bool success, ) = _recipient.call{value: amount}("");
        require(success, "Transfer to recipient failed");
        
        // Pay fee to relayer if applicable
        if (_fee > 0) {
            require(_relayer != address(0), "Relayer address cannot be zero");
            (bool relayerSuccess, ) = _relayer.call{value: _fee}("");
            require(relayerSuccess, "Fee transfer failed");
        }
        
        emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee, _denomination);
    }
    
    /**
     * @dev Verify the ZK proof
     * @param _proof ZK proof data
     * @param _root Merkle root
     * @param _nullifierHash Hash of nullifier
     * @return True if proof is valid
     */
    function verifyProof(
        bytes calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash
    ) internal view returns (bool) {
        // Call the verifier contract to check the proof
        (bool success, bytes memory data) = verifier.staticcall(
            abi.encodeWithSignature(
                "verifyProof(bytes,bytes32,bytes32)",
                _proof,
                _root,
                _nullifierHash
            )
        );
        
        require(success, "Verifier call failed");
        return abi.decode(data, (bool));
    }
    
    /**
     * @dev Update the verifier contract address (only owner)
     * @param _newVerifier New verifier address
     */
    function setVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Verifier address cannot be zero");
        verifier = _newVerifier;
    }
    
    /**
     * @dev Get the current Merkle root
     * @return Current root hash
     */
    function getLastRoot() external view returns (bytes32) {
        return merkleTree.getLastRoot();
    }
    
    /**
     * @dev Check if a given root exists in history
     * @param _root Root to check
     * @return True if the root exists
     */
    function isKnownRoot(bytes32 _root) external view returns (bool) {
        return merkleTree.isKnownRoot(_root);
    }
    
    /**
     * @dev Check if a nullifier has been used
     * @param _nullifierHash Nullifier hash to check
     * @return True if the nullifier has been used
     */
    function isSpent(bytes32 _nullifierHash) external view returns (bool) {
        return nullifierHashes[_nullifierHash];
    }
    
    /**
     * @dev Get all allowed denominations
     * @return Array of allowed denomination values
     */
    function getAllowedDenominations() external view returns (uint256[] memory) {
        return allowedDenominations;
    }
} 