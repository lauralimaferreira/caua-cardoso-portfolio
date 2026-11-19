import {hashPassword} from '../lib/security.mjs';
// Read via stdin so credentials are not passed as command-line arguments.
const chunks=[];let size=0;
for await(const chunk of process.stdin){size+=chunk.length;if(size>258){console.error('Password too long');process.exit(1);}chunks.push(chunk);}
try {console.log(await hashPassword(Buffer.concat(chunks).toString('utf8').replace(/\r?\n$/,'')));}
catch(e){console.error(e.message);process.exitCode=1;}
