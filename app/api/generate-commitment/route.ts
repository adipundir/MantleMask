import { NextRequest, NextResponse } from 'next/server';
const snarkjs = require("snarkjs");

export async function POST(req: NextRequest) {
  try {
    const { secret, amount } = await req.json();

    const input = {
      secret: secret,
      amount: amount
    };

    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      input,
      "./build/simple_js/simple.wasm",
      "./build/simple_final.zkey"
    );

    return NextResponse.json({
      commitment: publicSignals[0],
      nullifier: publicSignals[1],
      proof: proof
    });

  } catch (error) {
    console.error('Error generating commitment:', error);
    return NextResponse.json({ error: 'Failed to generate commitment' }, { status: 500 });
  }
} 