// خروجی رمزگذاری‌شدهٔ انبارها برای نسخهٔ آنلاین: node enc.js <behfaraz.db> <outDir> <password>
const crypto=require('crypto'),fs=require('fs'),path=require('path');
const {execFileSync}=require('child_process');
const [db,out,pw]=process.argv.slice(2);
const key=crypto.pbkdf2Sync(Buffer.from(pw,'utf8'),Buffer.from('behfaraz-online-data-v1','utf8'),250000,32,'sha256');
fs.mkdirSync(out,{recursive:true});
for(const [t,f] of [['warehouse_db','wh'],['warehouse_sale_db','whs']]){
  const row=JSON.parse(execFileSync('python3',['-c',`import sqlite3,json,sys;c=sqlite3.connect('file:'+sys.argv[1]+'?mode=ro',uri=True);r=c.execute('select rev,data,updated_at,updated_by from ${t} where id=1').fetchone();print(json.dumps({'rev':r[0],'data':json.loads(r[1]),'updated_at':r[2],'updated_by':r[3]}))`,db],{maxBuffer:1<<28}).toString());
  const iv=crypto.randomBytes(12),c=crypto.createCipheriv('aes-256-gcm',key,iv);
  const ct=Buffer.concat([c.update(JSON.stringify(row),'utf8'),c.final(),c.getAuthTag()]);
  fs.writeFileSync(path.join(out,f+'.enc.json'),JSON.stringify({v:1,iv:iv.toString('base64'),ct:ct.toString('base64'),rev:row.rev,updated_at:row.updated_at}));
  console.log(f,row.rev,row.updated_at,ct.length);
}
