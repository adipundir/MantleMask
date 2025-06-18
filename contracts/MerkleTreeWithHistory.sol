// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./libraries/PoseidonT3.sol";

/**
 * @title MerkleTreeWithHistory
 * @dev Implements an incremental Merkle tree with history
 * This is a separate contract to handle the Merkle tree logic
 * Inspired by Tornado Cash's implementation
 */
contract MerkleTreeWithHistory {
    // Merkle Tree constants and variables
    uint32 public constant ROOT_HISTORY_SIZE = 100;
    uint32 public immutable levels;
    
    // Zero values for each level in the tree
    bytes32[] public zeros;
    
    // Current index in the tree (number of inserted leaves)
    uint32 public currentRootIndex;
    
    // Current leaf insertion index
    uint32 public nextLeafIndex;
    
    // Filled subtrees
    mapping(uint256 => bytes32) public filledSubtrees;
    
    // Historical roots
    mapping(uint256 => bytes32) public roots;

    // Commitments mapping to check for duplicates
    mapping(bytes32 => bool) public commitments;
    
    /**
     * @dev Constructor initializes the Merkle tree
     * @param _levels Height of the Merkle tree
     */
    constructor(uint32 _levels) {
        require(_levels > 0, "Merkle tree height should be greater than 0");
        require(_levels <= 32, "Merkle tree height should be less than or equal to 32");
        
        levels = _levels;
        
        // Initialize the Merkle tree with zeros
        bytes32 currentZero = zeros(_levels);
        for (uint32 i = 0; i < _levels; i++) {
            filledSubtrees[i] = currentZero;
            currentZero = hashLeftRight(currentZero, currentZero);
        }
        
        roots[0] = currentZero;
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
     * @dev Get the zero value for a specific level
     * @param _i Level index
     * @return Zero value for the level
     */
    function zeros(uint256 _i) public pure returns (bytes32) {
        if (_i == 0) return bytes32(0);
        else if (_i == 1) return hashLeftRight(bytes32(0), bytes32(0));
        else if (_i == 2) return hashLeftRight(hashLeftRight(bytes32(0), bytes32(0)), hashLeftRight(bytes32(0), bytes32(0)));
        else if (_i == 3) return hashLeftRight(
            hashLeftRight(hashLeftRight(bytes32(0), bytes32(0)), hashLeftRight(bytes32(0), bytes32(0))),
            hashLeftRight(hashLeftRight(bytes32(0), bytes32(0)), hashLeftRight(bytes32(0), bytes32(0)))
        );
        else revert("Index out of bounds");
    }
    
    /**
     * @dev Insert a new leaf into the Merkle tree
     * @param _leaf Leaf to insert
     * @return Index of the inserted leaf
     */
    function _insert(bytes32 _leaf) internal returns (uint32) {
        require(!commitments[_leaf], "The commitment has been submitted");
        uint32 currentIndex = nextLeafIndex;
        require(currentIndex != uint32(2)**levels, "Merkle tree is full");
        
        // Mark the commitment as used
        commitments[_leaf] = true;
        
        // Start from the leaf and update the tree
        bytes32 currentLevelHash = _leaf;
        bytes32 left;
        bytes32 right;
        
        for (uint32 i = 0; i < levels; i++) {
            // If current index is even (left child)
            if (currentIndex % 2 == 0) {
                left = currentLevelHash;
                right = zeros(i);
                filledSubtrees[i] = currentLevelHash;
            } else {
                // If current index is odd (right child)
                left = filledSubtrees[i];
                right = currentLevelHash;
            }
            
            currentLevelHash = hashLeftRight(left, right);
            currentIndex /= 2;
        }
        
        // Update the root history
        currentRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        roots[currentRootIndex] = currentLevelHash;
        nextLeafIndex++;
        
        return nextLeafIndex - 1;
    }
    
    /**
     * @dev Get the current Merkle root
     * @return Current root hash
     */
    function getLastRoot() external view returns (bytes32) {
        return roots[currentRootIndex];
    }
    
    /**
     * @dev Check if a given root exists in history
     * @param _root Root to check
     * @return True if the root exists
     */
    function isKnownRoot(bytes32 _root) public view returns (bool) {
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
                i = ROOT_HISTORY_SIZE;
            }
            i--;
        } while (i != currentRootIndex);
        
        return false;
    }
} 