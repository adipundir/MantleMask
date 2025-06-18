// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PoseidonT3
 * @dev Efficient implementation of Poseidon hash function with 2 inputs (T3)
 * Inspired by Tornado Cash's implementation
 */
library PoseidonT3 {
    // Addresses are placeholders - in production, these would be the actual precompile addresses
    address constant POSEIDON_T3_PRECOMPILE = address(0x0000000000000000000000000000000000000009);
    
    // Field size
    uint256 constant FIELD_SIZE = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    
    /**
     * @dev Get round constants for Poseidon hash
     * @param i Index of the constant
     * @return The constant value
     */
    function getConstant(uint256 i) internal pure returns (uint256) {
        if (i == 0) return 0x09c46e9ec68e9bd4fe1faaba294cba38a71aa177534cdd1b6c7dc0dbd0abd7a7;
        if (i == 1) return 0x0c0356530967980fc9ef0d8a854f9c7a6e7a0c1cf10e1b4b7c11f5c2a177eeed;
        if (i == 2) return 0x1a5e0e188a4f70f3cb7f58395b3048a61a862fbac59360c39bc7e6dbf1619afe;
        if (i == 3) return 0x0f7b1544de48ef0e9991bec7c3cdf6961a7723f8961c5b15b5ab4df89a8f9383;
        if (i == 4) return 0x0f8721ce358c4b5d15f3a6dabc0c079b3f5f7c13f760c6a7ceecf1af36b0c596;
        if (i == 5) return 0x09b8f7e0a306d9d5f8fe4c9e7f0b0a0f6945d9d1eb3dd24cf9379a75f459e51e;
        if (i == 6) return 0x0daecf5e5e7512a8756d37de99c8d30f5351b0fee3750d05e9ca7c65d34f77c9;
        if (i == 7) return 0x0d4d7a7e0184d48d1f369d4b83b5cb6aadf7c25e6c2d90c86f3f0d2a1f22393a;
        if (i == 8) return 0x09d0f27b9759d0e09e7511c42c2c3d0d240e5e4526db1c3f86f0b8c112bed742;
        if (i == 9) return 0x0c328e69d5fea3e429ae32594065e8c4d0d3c9d9a3cb47aad77c46e2a7b0e3f8;
        if (i == 10) return 0x0f0d1dc7e1b8a5bf8b6673216f53f395d3e3ce97d0b700e78e3e8f8e531016a3;
        if (i == 11) return 0x19e9dc0250d4d3c25c36f040a695e344f37c012b8e34d5a9a4d8c26db2a32c59;
        revert("Index out of bounds");
    }
    
    /**
     * @dev Computes the Poseidon hash of the inputs
     * @param _inputs Array of inputs (must have 2 elements for T3)
     * @return The hash result
     */
    function poseidon(uint256[2] memory _inputs) internal view returns (uint256) {
        // If precompile is available, use it
        if (isPrecompileAvailable()) {
            return poseidonPrecompile(_inputs);
        }
        
        // Fallback to optimized implementation
        return poseidonOptimized(_inputs);
    }
    
    /**
     * @dev Check if the precompile is available
     * @return True if the precompile is available
     */
    function isPrecompileAvailable() internal view returns (bool) {
        uint256 size;
        assembly {
            size := extcodesize(0x0000000000000000000000000000000000000009)
        }
        return size > 0;
    }
    
    /**
     * @dev Call the precompiled Poseidon implementation
     * @param _inputs Array of inputs
     * @return The hash result
     */
    function poseidonPrecompile(uint256[2] memory _inputs) internal view returns (uint256) {
        (bool success, bytes memory result) = POSEIDON_T3_PRECOMPILE.staticcall(
            abi.encode(_inputs[0], _inputs[1])
        );
        
        require(success, "PoseidonT3: precompile call failed");
        return abi.decode(result, (uint256));
    }
    
    /**
     * @dev Optimized implementation of Poseidon hash
     * @param _inputs Array of inputs
     * @return The hash result
     */
    function poseidonOptimized(uint256[2] memory _inputs) internal pure returns (uint256) {
        // Initialize state with inputs
        uint256 s0 = _inputs[0];
        uint256 s1 = _inputs[1];
        uint256 s2 = 0; // State variable
        
        // Apply the first round constants
        s0 = addmod(s0, getConstant(0), FIELD_SIZE);
        s1 = addmod(s1, getConstant(1), FIELD_SIZE);
        s2 = addmod(s2, getConstant(2), FIELD_SIZE);
        
        // Apply 4 full rounds
        for (uint256 i = 0; i < 4; i++) {
            // Apply S-box (x^5) to each state element
            s0 = sbox(s0);
            s1 = sbox(s1);
            s2 = sbox(s2);
            
            // Apply MDS matrix (mix the state)
            (s0, s1, s2) = mix(s0, s1, s2);
            
            // Add round constants
            s0 = addmod(s0, getConstant(3 + i*3), FIELD_SIZE);
            s1 = addmod(s1, getConstant(4 + i*3), FIELD_SIZE);
            s2 = addmod(s2, getConstant(5 + i*3), FIELD_SIZE);
        }
        
        // Return the first state element as the hash result
        return s0;
    }
    
    /**
     * @dev S-box function for Poseidon (x^5 mod p)
     * @param x Input value
     * @return x^5 mod FIELD_SIZE
     */
    function sbox(uint256 x) internal pure returns (uint256) {
        uint256 x2 = mulmod(x, x, FIELD_SIZE);
        uint256 x4 = mulmod(x2, x2, FIELD_SIZE);
        return mulmod(x, x4, FIELD_SIZE);
    }
    
    /**
     * @dev Mix function - applies the MDS matrix
     * @param s0 First state element
     * @param s1 Second state element
     * @param s2 Third state element
     * @return Mixed state elements
     */
    function mix(uint256 s0, uint256 s1, uint256 s2) internal pure returns (uint256, uint256, uint256) {
        uint256 t0 = addmod(addmod(mulmod(2, s0, FIELD_SIZE), s1, FIELD_SIZE), s2, FIELD_SIZE);
        uint256 t1 = addmod(addmod(s0, mulmod(2, s1, FIELD_SIZE), FIELD_SIZE), s2, FIELD_SIZE);
        uint256 t2 = addmod(addmod(s0, s1, FIELD_SIZE), mulmod(2, s2, FIELD_SIZE), FIELD_SIZE);
        
        return (t0, t1, t2);
    }
} 