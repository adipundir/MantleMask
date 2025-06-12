/**
 * Type declarations for circomlibjs
 */
declare module 'circomlibjs' {
  /**
   * Builds a Poseidon hash function instance
   */
  export function buildPoseidon(): Promise<any>;
  
  /**
   * Builds a MiMC hash function instance
   */
  export function buildMimc7(): Promise<any>;
  
  /**
   * Builds a Pedersen hash function instance
   */
  export function buildPedersenHash(): Promise<any>;
  
  /**
   * Builds a BabyJub elliptic curve instance
   */
  export function buildBabyjub(): Promise<any>;
} 