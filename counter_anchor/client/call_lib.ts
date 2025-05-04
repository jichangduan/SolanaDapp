import * as anchor from "@coral-xyz/anchor";
import { 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Connection, 
  clusterApiUrl, 
  Transaction, 
  sendAndConfirmTransaction, 
  LAMPORTS_PER_SOL
} from "@solana/web3.js";
import * as fs from 'fs';

const keypairFile = './new-wallet.json';
const walletKeypair = Keypair.fromSecretKey(
  Buffer.from(JSON.parse(fs.readFileSync(keypairFile, 'utf-8')))
);
const wallet = new anchor.Wallet(walletKeypair);

const connection = new Connection(clusterApiUrl('devnet'), 'confirmed');

const receiverKeypair = Keypair.generate();
const receiverAddress = receiverKeypair.publicKey;

async function main() {
  console.log("钱包地址:", wallet.publicKey.toBase58());
  console.log("接收者地址:", receiverAddress.toBase58());

  try {

    const balance = await connection.getBalance(wallet.publicKey);
    console.log("钱包余额:", balance / LAMPORTS_PER_SOL, "SOL");
    
    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      console.error("钱包余额不足");
      return;
    }
    
    const transferAmount = 0.01 * LAMPORTS_PER_SOL; // 0.01 SOL
    
    const transferInstruction = SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: receiverAddress,
      lamports: transferAmount,
    });
    
    const tx = new Transaction().add(transferInstruction);
    
    const signature = await sendAndConfirmTransaction(
      connection,
      tx,
      [walletKeypair],
      { commitment: 'confirmed' }
    );
    
    console.log("交易已成功发送！");
    console.log("交易哈希:", signature);
    console.log("交易详情: https://explorer.solana.com/tx/" + signature + "?cluster=devnet");
    
    console.log("等待账户更新...");
    await new Promise(resolve => setTimeout(resolve, 2000));

    const newSenderBalance = await connection.getBalance(wallet.publicKey);
    const receiverBalance = await connection.getBalance(receiverAddress);
    
    console.log("-------------------------------------");
    console.log("交易结果:");
    console.log("发送者新余额:", newSenderBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("接收者余额:", receiverBalance / LAMPORTS_PER_SOL, "SOL");
    console.log("-------------------------------------");
    console.log("交易成功完成！");
    
  } catch (err) {
    console.error("交易失败:", err);
    if (err instanceof Error && 'logs' in err) {
      console.error("错误日志:", (err as any).logs);
    }
  }
}

main(); 