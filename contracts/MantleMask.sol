// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "./libraries/PoseidonT3.sol";
import "./MerkleTreeWithHistory.sol";

/**
 * @title MantleMask
 * @dev Privacy-focused contract for anonymous native MNT transfers on Mantle Network
 * Uses zero-knowledge proofs and Merkle trees to ensure transaction privacy
 * Inspired by Tornado Cash architecture
 */
contract MantleMask is MerkleTreeWithHistory, ReentrancyGuard, Ownable {
    // Events
    event Deposit(bytes32 indexed commitment, uint256 leafIndex, uint256 timestamp);
    event Withdrawal(address to, bytes32 nullifierHash, address indexed relayer, uint256 fee);
    
    // Mapping to track spent nullifiers (prevents double-spending)
    mapping(bytes32 => bool) public nullifierHashes;
    
    // Allowed denominations for deposits
    uint256 public immutable denomination;
    
    // Verifier contract for ZK proofs
    IVerifier public verifier;
    
    // Interface for the verifier contract
    interface IVerifier {
        function verifyProof(bytes calldata _proof, bytes32 _root, bytes32 _nullifierHash, address _recipient, address _relayer, uint256 _fee, uint256 _denomination) external view returns (bool);
    }
    
    /**
     * @dev Constructor initializes the contract with parameters
     * @param _denomination Denomination amount in wei
     * @param _merkleTreeHeight Height of the Merkle tree (determines max deposits)
     * @param _verifier Address of the ZK proof verifier contract
     */
    constructor(
        uint256 _denomination,
        uint32 _merkleTreeHeight,
        address _verifier
    ) MerkleTreeWithHistory(_merkleTreeHeight) Ownable(msg.sender) {
        require(_verifier != address(0), "Verifier address cannot be zero");
        require(_denomination > 0, "Denomination should be greater than 0");
        
        denomination = _denomination;
        verifier = IVerifier(_verifier);
    }
    
    /**
     * @dev Deposit function - user deposits native MNT and adds commitment to Merkle tree
     * @param _commitment The commitment hash (derived from nullifier and secret)
     * Note: The commitment is a Poseidon hash of (nullifier, secret) generated client-side
     */
    function deposit(bytes32 _commitment) external payable nonReentrant {
        require(msg.value == denomination, "Please send exactly the denomination amount");
        require(_commitment != bytes32(0), "Cannot deposit with zero commitment");
        
        // Insert the commitment into the Merkle tree
        uint32 insertedIndex = _insert(_commitment);
        
        emit Deposit(_commitment, insertedIndex, block.timestamp);
    }
    
    /**
     * @dev Withdraw function - verifies ZK proof and sends native MNT to recipient
     * @param _proof ZK proof data
     * @param _root Merkle root
     * @param _nullifierHash Hash of nullifier to prevent double-spending
     * @param _recipient Address to receive the withdrawn tokens
     * @param _relayer Address of relayer (for optional relayer fees)
     * @param _fee Fee paid to relayer (0 if no relayer used)
     */
    function withdraw(
        bytes calldata _proof,
        bytes32 _root,
        bytes32 _nullifierHash,
        address payable _recipient,
        address payable _relayer,
        uint256 _fee
    ) external nonReentrant {
        require(_fee <= denomination, "Fee exceeds transfer value");
        require(!nullifierHashes[_nullifierHash], "The note has been already spent");
        require(isKnownRoot(_root), "Cannot find your merkle root");
        require(_recipient != address(0), "Cannot withdraw to zero address");
        
        // Verify the proof
        require(
            verifier.verifyProof(
                _proof,
                _root,
                _nullifierHash,
                _recipient,
                _relayer,
                _fee,
                denomination
            ),
            "Invalid withdraw proof"
        );
        
        // Mark nullifier as spent
        nullifierHashes[_nullifierHash] = true;
        
        // Calculate amount after fee
        uint256 amount = denomination - _fee;
        
        // Transfer native MNT to recipient
        (bool success, ) = _recipient.call{value: amount}("");
        require(success, "Transfer to recipient failed");
        
        // Pay fee to relayer if applicable
        if (_fee > 0) {
            (bool relayerSuccess, ) = _relayer.call{value: _fee}("");
            require(relayerSuccess, "Fee transfer failed");
        }
        
        emit Withdrawal(_recipient, _nullifierHash, _relayer, _fee);
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
     * @dev Update the verifier contract address (only owner)
     * @param _newVerifier New verifier address
     */
    function setVerifier(address _newVerifier) external onlyOwner {
        require(_newVerifier != address(0), "Verifier address cannot be zero");
        verifier = IVerifier(_newVerifier);
    }
} 