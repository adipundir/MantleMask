// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./interfaces/IMerkleTreeWithHistory.sol";
import "./libraries/PoseidonT3.sol";

/**
 * @title MerkleTreeWithHistory
 * @dev Implements a Merkle tree with historical roots for ZK proofs
 * Uses Poseidon hash function which is efficient for ZK circuits
 */
contract MerkleTreeWithHistory is IMerkleTreeWithHistory {
    // Number of historical roots to keep
    uint32 public constant MERKLE_TREE_HISTORY_SIZE = 100;
    
    // Zero values for each level in the tree
    bytes32[] public zeros;
    
    // Current index in the tree (number of inserted leaves)
    uint32 public currentRootIndex;
    
    // Current leaf insertion index
    uint32 public nextLeafIndex;
    
    // Filled subtrees
    bytes32[] public filledSubtrees;
    
    // Historical roots
    bytes32[MERKLE_TREE_HISTORY_SIZE] public roots;
    
    // Tree height
    uint32 public immutable levels;

    /**
     * @dev Constructor to initialize the Merkle tree
     * @param _levels Height of the Merkle tree
     */
    constructor(uint32 _levels) {
        require(_levels > 0, "Levels should be greater than 0");
        require(_levels <= 32, "Levels should be less than or equal to 32");
        
        levels = _levels;
        
        // Initialize zeros and filled subtrees
        bytes32 currentZero = bytes32(0);
        zeros.push(currentZero);
        filledSubtrees.push(currentZero);
        
        for (uint32 i = 1; i < _levels; i++) {
            currentZero = hashLeftRight(currentZero, currentZero);
            zeros.push(currentZero);
            filledSubtrees.push(currentZero);
        }
        
        // Initialize the first root
        roots[0] = hashLeftRight(currentZero, currentZero);
    }
    
    /**
     * @dev Hash two child nodes to get parent node using Poseidon hash
     * @param _left Left child
     * @param _right Right child
     * @return Parent node hash
     */
    function hashLeftRight(bytes32 _left, bytes32 _right) public pure returns (bytes32) {
        return bytes32(PoseidonT3.poseidon([uint256(uint256(_left)), uint256(uint256(_right))]));
    }
    
    /**
     * @dev Insert a new leaf into the Merkle tree
     * @param _leaf Leaf to insert
     * @return Index of the inserted leaf
     */
    function insert(bytes32 _leaf) external override returns (uint256) {
        uint32 currentIndex = nextLeafIndex;
        require(currentIndex != uint32(2)**levels, "Merkle tree is full");
        
        uint32 currentLevelIndex = currentIndex;
        bytes32 currentLevelHash = _leaf;
        bytes32 left;
        bytes32 right;
        
        // Update the tree
        for (uint32 i = 0; i < levels; i++) {
            if (currentLevelIndex % 2 == 0) {
                // If current index is even, update the filled subtree at this level
                left = currentLevelHash;
                right = zeros[i];
                filledSubtrees[i] = currentLevelHash;
            } else {
                // If current index is odd, hash with the filled subtree
                left = filledSubtrees[i];
                right = currentLevelHash;
            }
            
            currentLevelHash = hashLeftRight(left, right);
            currentLevelIndex /= 2;
        }
        
        // Update the root history
        currentRootIndex = (currentRootIndex + 1) % MERKLE_TREE_HISTORY_SIZE;
        roots[currentRootIndex] = currentLevelHash;
        nextLeafIndex = currentIndex + 1;
        
        return currentIndex;
    }
    
    /**
     * @dev Get the current root of the Merkle tree
     * @return Current root
     */
    function getLastRoot() external view override returns (bytes32) {
        return roots[currentRootIndex];
    }
    
    /**
     * @dev Check if a root exists in the history
     * @param _root Root to check
     * @return True if the root exists
     */
    function isKnownRoot(bytes32 _root) external view override returns (bool) {
        if (_root == 0) {
            return false;
        }
        
        // Check if _root is one of the historical roots
        uint32 i = currentRootIndex;
        do {
            if (_root == roots[i]) {
                return true;
            }
            
            if (i == 0) {
                i = MERKLE_TREE_HISTORY_SIZE;
            }
            i--;
        } while (i != currentRootIndex);
        
        return false;
    }
} 