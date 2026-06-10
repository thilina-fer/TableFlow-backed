const mongoose = require('mongoose');

async function run() {
  await mongoose.connect('mongodb://127.0.0.1:27017/tableflow');
  const db = mongoose.connection.db;
  const tables = await db.collection('tables').find().toArray();
  if (tables.length === 0) {
    console.log("No tables found.");
    process.exit(0);
  }
  const table = tables[0];
  console.log("Table ID:", table._id);
  console.log("QR Code URL start:", table.qrCodeUrl ? table.qrCodeUrl.substring(0, 50) : "null");
  
  const res = await fetch(`http://localhost:5000/api/tables/${table._id}/qr`);
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  
  process.exit(0);
}

run().catch(console.error);
