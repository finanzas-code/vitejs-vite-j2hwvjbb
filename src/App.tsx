import { useState, useCallback } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// TIPOS
// ─────────────────────────────────────────────────────────────────────────────
interface LLCRow {
  tokenId: string;
  tokenAddress: string;
  aTokenAddress?: string;
  moneda: 'USD' | 'EUR';
  inmueble: string;
  ein: string;
  constitucion: string;
  direccion: string;
}
interface Wallet {
  id: number;
  address: string;
  label: string;
}
interface TokenResult {
  tokenAddress: string;
  llc: LLCRow;
  balance: number;
  valorEur: number;
  valorAdqEur: number;
  fechaPrimeraAdq: string;
  numOperaciones: number;
  walletLabel: string;
  walletAddr: string;
  enAave: boolean;
  balanceAave: number;
}
// ─────────────────────────────────────────────────────────────────────────────

const MORALIS_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImVjZGNjZDhiLTVmYjAtNDExMC1iZWUxLTY2ZGNhODQwZjE2MyIsIm9yZ0lkIjoiNDc4Njc3IiwidXNlcklkIjoiNDkyNDY4IiwidHlwZUlkIjoiZmQ5Zjk4ZTUtZTc1Yy00Mjk0LWJkZjYtMmZiZTg0NjgzZmZiIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3Njk4NjYwMTIsImV4cCI6NDkyNTYyNjAxMn0.StuCFBwn4_Wv32m2FeuCeuMzJPVVWlewCwE2VxnMzto';
const CURRENT_YEAR = new Date().getFullYear();
const EJERCICIOS = [CURRENT_YEAR - 1, CURRENT_YEAR - 2, CURRENT_YEAR - 3];
const VALOR_NOMINAL = 100;

const MORALIS_BASE = 'https://deep-index.moralis.io/api/v2.2';
const FRANKFURTER = 'https://api.frankfurter.app';
const POLYGON_RPC = 'https://polygon-rpc.com';

const CATALOG_DEFAULT: LLCRow[] = [
  { tokenId: 'MIA-1', tokenAddress: '0x2f1026ff5bd94232050364c81d61a2d15e147209', aTokenAddress: '0x94549bc840036f3a4172435cd07B50b6C271edD3', moneda: 'USD', inmueble: 'Miami 1', ein: '93-3023660', constitucion: '11/04/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'SMA-1', tokenAddress: '0x49b8f29f17a27ae89121642838e37bc8ce77d2f2', moneda: 'USD', inmueble: 'San Miguel de Allende 1', ein: '93-2804192', constitucion: '22/05/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'JAX-1', tokenAddress: '0x8711b4172ed71d2d4f90e3e2f0cb63726acba8e6', moneda: 'USD', inmueble: 'Jacksonville 1', ein: '93-2742824', constitucion: '06/07/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'JAX-2', tokenAddress: '0xad3e1f50590ef6f323caa0cf43f39d28d1d34144', moneda: 'USD', inmueble: 'Jacksonville 2', ein: '93-3035759', constitucion: '03/08/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'SMA-2', tokenAddress: '0xca53dd67cfa553d9e31c377602fb217dff9eadff', moneda: 'USD', inmueble: 'San Miguel de Allende 2', ein: '93-3082985', constitucion: '04/08/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'JAX-3', tokenAddress: '0x9c09c8525c5baa3b254cb0a60d3565cfbd5c9f28', moneda: 'USD', inmueble: 'Jacksonville 3', ein: '93-3060673', constitucion: '17/08/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'JAX-4', tokenAddress: '0xf7e0069442e3e2d061673e16d2f77a3b87b45a42', moneda: 'USD', inmueble: 'Jacksonville 4', ein: '93-4177833', constitucion: '15/09/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'JAX-5', tokenAddress: '0xd48b1f302c8eb4a0f691fde99deaa9316d67a7db', moneda: 'USD', inmueble: 'Jacksonville 5', ein: '93-4195281', constitucion: '15/09/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'RDO-1', tokenAddress: '0xf7a694bc2768fc3b26beb5e98bb76f744397e49c', moneda: 'USD', inmueble: 'Punta Cana 1', ein: '93-4216174', constitucion: '19/10/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'RDO-2', tokenAddress: '0x454c0841a409b1752a6cf51fa8ed2fd28a6291c6', moneda: 'USD', inmueble: 'Punta Cana 2', ein: '93-4244134', constitucion: '21/10/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'MIA-2', tokenAddress: '0xf1ec7e14489683babdb9299e5f9908d19a8759dc', aTokenAddress: '0xA708386b43286EA3f29F1CF112A55d90d4049f9E', moneda: 'USD', inmueble: 'Miami 2', ein: '93-4296521', constitucion: '06/11/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'MIA-3', tokenAddress: '0xb0825e7a4093d21ed076883f8aca33300631291e', moneda: 'USD', inmueble: 'Miami 3', ein: '93-4318348', constitucion: '06/11/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'RDO-3', tokenAddress: '0x820380fea111509a38297fa2971eee5b41a5aeca', moneda: 'USD', inmueble: 'Punta Cana 3', ein: '93-4260418', constitucion: '21/10/2023', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'MAYA-1', tokenAddress: '0x6b4fa3c69e62f8f03dc018b57efa74d560462210', moneda: 'USD', inmueble: 'Token Maya', ein: '99-1022320', constitucion: '04/01/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'RDO-4', tokenAddress: '0x954229f463f73a857fddc346857771c1ef3f7c00', moneda: 'USD', inmueble: 'Punta Cana 4', ein: '99-1239173', constitucion: '08/02/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'RDO-5', tokenAddress: '0xdecfebdaf1131899fb38a53dc63671246220ab7a', moneda: 'USD', inmueble: 'Punta Cana 5', ein: '99-1257983', constitucion: '08/02/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'RDO-6', tokenAddress: '0x093984f85f980479172fb96982f79c418ac730f7', moneda: 'USD', inmueble: 'Punta Cana 6', ein: '99-1280315', constitucion: '08/02/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'PAZ-1', tokenAddress: '0xf8657256c5cd5fdb044e55d1ec39e9b8c969dbf1', moneda: 'USD', inmueble: 'Paz 1', ein: '99-3414792', constitucion: '05/07/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'CDS-1', tokenAddress: '0x5ab768c8ca1cc20cb8ec7b90554a3b12524b6c47', moneda: 'EUR', inmueble: 'Costa del Sol 1', ein: '99-4784391', constitucion: '27/06/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'BKL-1', tokenAddress: '0xfb759e0cc5cff4aea606064acd41c71c7c11bf40', moneda: 'USD', inmueble: 'Bacalar 1', ein: '33-1402792', constitucion: '02/10/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'MAD-2', tokenAddress: '0x364b1709fdf909c431a31284d7e1858a7401a0c7', moneda: 'EUR', inmueble: 'Madrid 2', ein: '33-1618100', constitucion: '15/10/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'MRB-1', tokenAddress: '0x4adaee2dae690cf8f3915f1c1963f16d239c5e11', moneda: 'EUR', inmueble: 'Marbella 1', ein: '33-1857648', constitucion: '08/11/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'BKL-2', tokenAddress: '0xed923b814f1ea3d42c54dda55ba8edfaba994489', moneda: 'USD', inmueble: 'Bacalar 2', ein: '33-2743272', constitucion: '19/12/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'HOU-1', tokenAddress: '0xf090b60f731583288e8c7c9d9a80680e35bd63e0', moneda: 'USD', inmueble: 'Houston 1', ein: '33-2543809', constitucion: '26/12/2024', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'MUR-1', tokenAddress: '0x29da137d6dba774ad4f79323374f685682542767', moneda: 'EUR', inmueble: 'Murcia 1', ein: '33-2808097', constitucion: '06/01/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'AZN-1', tokenAddress: '0x74ff5b71c043645cede9caca31a693f8cf819fb5', moneda: 'USD', inmueble: 'Arizona 1', ein: '33-3250550', constitucion: '27/01/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'HOU-2', tokenAddress: '0xe56ff2dff2c2e95511f0bef4b3d92da05e8197c0', moneda: 'USD', inmueble: 'Houston 2', ein: '33-3508722', constitucion: '02/03/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'HOU-3', tokenAddress: '0xe16901dad396fe7b1b77b6d2bd91b2d648e8a762', moneda: 'USD', inmueble: 'Houston 3', ein: '33-3581871', constitucion: '13/02/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'ATL-1', tokenAddress: '0x68f73061bdf369c2562f4c0ea4e940f362d1a97f', moneda: 'USD', inmueble: 'Atlanta 1', ein: '33-3953936', constitucion: '19/02/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'BKL-3', tokenAddress: '0x70e77c5f094534505d6a42f913d3a387e6db0842', moneda: 'USD', inmueble: 'Bacalar 3', ein: '33-4009643', constitucion: '26/02/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'YCT-1', tokenAddress: '0xaaad2db2f624dc5a350d579d834b5fe12b2bcd8d', moneda: 'USD', inmueble: 'Yucatan 1', ein: '33-4613560', constitucion: '26/03/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'FMY-1', tokenAddress: '0x8e08d151466bd8499a89ee9254586ef141f324c9', moneda: 'USD', inmueble: 'Fort Myers 1', ein: '33-4678287', constitucion: '26/03/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'BPT-1', tokenAddress: '0x55cb210f496df649fd283aa93a360e24fdb40964', aTokenAddress: '0x30e3A27580A25D2234bA3873Aa07e42217C284e3', moneda: 'USD', inmueble: 'Bridgeport 1', ein: '33-4631593', constitucion: '03/04/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'VLC-12', tokenAddress: '0x8a96bf9aa5812ce957aed1f554065b64a545c88a', moneda: 'EUR', inmueble: 'Valencia 12', ein: '36-5169784', constitucion: '09/04/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'MAD-3', tokenAddress: '0x7a7e4dd51d1ca1aa701b0eb76ba5f59cec2fbaa1', moneda: 'EUR', inmueble: 'Madrid 3', ein: '33-5030908', constitucion: '24/04/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'SLA-2', tokenAddress: '0x8eeb57505999d3092c7b00ad5a5e53b943ad235d', moneda: 'USD', inmueble: 'Salta 2', ein: '39-2136449', constitucion: '02/05/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'YCT-2', tokenAddress: '0xa0d99b441a9a5e334b234f31a92b97fa8d663626', moneda: 'USD', inmueble: 'Yucatan 2', ein: '39-2260411', constitucion: '09/05/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'GRX-2', tokenAddress: '0x8833890a36adb704bfc8bf3726a661395d27c0d7', moneda: 'EUR', inmueble: 'Granada 2', ein: '39-2770362', constitucion: '15/05/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'GRX-3', tokenAddress: '0x2a8bbc241849431e9cc7c4dbea9c05dfac2de553', moneda: 'EUR', inmueble: 'Granada 3', ein: '39-2791433', constitucion: '28/05/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'DXB-1', tokenAddress: '0xe59dde10d38df397c996bdb1325b6f81684a8b80', moneda: 'USD', inmueble: 'Dubai 1', ein: '39-2847829', constitucion: '12/06/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'SAM-1', tokenAddress: '0x69072424b70ed26ff987fcb49258b7e8f93c6d82', moneda: 'USD', inmueble: 'Samana 1', ein: '39-2888816', constitucion: '17/06/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'NPL-1', tokenAddress: '0x2d1838eb7ebb6ae8b1288872f9704e3400ee8b20', moneda: 'USD', inmueble: 'Naples 1', ein: '39-2867505', constitucion: '17/06/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'DNB-1', tokenAddress: '0x21ae95a56ef471370ce89a7a4624117f31810927', moneda: 'USD', inmueble: 'Dania Beach 1', ein: '39-3051321', constitucion: '24/06/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'IDX-1', tokenAddress: '0x1998bc7570ae301154e0c3017acbb200b87ad1af', moneda: 'EUR', inmueble: 'Index 1', ein: 'L25000315949', constitucion: '09/07/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'LVT-1', tokenAddress: '0x418a55e0dc6fc134e44c7c7da5703c7f1c3c4b74', moneda: 'EUR', inmueble: 'Levante 1', ein: '39-3685636', constitucion: '31/07/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'SAM-2', tokenAddress: '0x8ddea623f8ffa94aae50dc4c44da22d6e570a749', moneda: 'USD', inmueble: 'Samana 2', ein: '61-2293419', constitucion: '28/08/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'PRO-100', tokenAddress: '0xcc4c1ce8d335bd40a0acf17b9ab08c030cc299aa', moneda: 'USD', inmueble: 'Proyecto 100', ein: '38-4370746', constitucion: '03/09/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'RET-1', tokenAddress: '0xc48b58aae1fb770a8655e44de960eb7dc84a5de9', moneda: 'EUR', inmueble: 'Renta 1', ein: '30-1461983', constitucion: '02/10/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'OPO-1', tokenAddress: '0x18bb9840fd7185c0589ca5fb81a32e3e2d0f2676', moneda: 'EUR', inmueble: 'Opportunity 1', ein: '32-0832057', constitucion: '21/10/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'CME-1', tokenAddress: '0x243e4bacc4b4d61b87816c945544286eb29125c6', moneda: 'EUR', inmueble: 'Costa Mediterránea 1', ein: 'L25000516031', constitucion: '12/11/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'DXB-2', tokenAddress: '0x46182d6937ed8cf2707e187b61b654e8ca59c7b5', moneda: 'USD', inmueble: 'Dubai 2', ein: '35-2933252', constitucion: '12/11/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'ABD-1', tokenAddress: '0x754f5b74e2639cef67fecec03f4d698470bdc92f', moneda: 'USD', inmueble: 'Abu Dhabi 1', ein: '32-0837740', constitucion: '12/11/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'MAD-4', tokenAddress: '0xa5f1c9a6567213fb7fa5511013ae3c9bb0b235a0', moneda: 'EUR', inmueble: 'Madrid 4', ein: '37-2209455', constitucion: '12/11/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
  { tokenId: 'CMY-1', tokenAddress: '0xe6e3ff145a6ffcd1dac08472f89164c0c43316b2', moneda: 'USD', inmueble: 'Costa Maya 1', ein: '35-2931907', constitucion: '12/11/2025', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' },
];

const fmtNum = (n: number, d = 2) => Number(n).toLocaleString('es-ES', { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtEur = (n: number) => Number(n).toLocaleString('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
const short = (a = '') => a.length > 10 ? `${a.slice(0, 6)}...${a.slice(-4)}` : a;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const isoDate = (ts: string) => new Date(ts).toISOString().slice(0, 10);
const today = () => new Date().toISOString().slice(0, 10);

async function moralis(path: string) {
  const res = await fetch(`${MORALIS_BASE}${path}`, {
    headers: { 'X-API-Key': MORALIS_API_KEY, Accept: 'application/json' },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
}

function getAaveATokenAddress(llc: LLCRow) {
  return llc.aTokenAddress || null;
}

async function getWalletTokensAtDate(wallet: string, fechaRef: string): Promise<any[]> {
  try {
    const dateISO = fechaRef + 'T23:59:59.000Z';
    const blockRes = await moralis(`/dateToBlock?chain=polygon&date=${encodeURIComponent(dateISO)}`);
    const blockNumber = blockRes.block;
    if (!blockNumber) throw new Error('No block returned');
    const balRes = await moralis(`/${wallet}/erc20?chain=polygon&to_block=${blockNumber}`);
    const tokens = Array.isArray(balRes) ? balRes : balRes.result || [];
    return tokens;
  } catch (e) {
    console.warn('getWalletTokensAtDate error:', e);
    return [];
  }
}

function matchAaveTokenToCatalog(tok: any, catalog: LLCRow[]): LLCRow | null {
  const sym = tok.symbol || '';
  const match = sym.match(/^aMatReental-(.+)$/i);
  if (!match) return null;
  const tokenId = match[1].toUpperCase();
  return catalog.find((llc) => llc.tokenId.toUpperCase() === tokenId) || null;
}


async function getAaveBalanceAt(wallet: string, aTokenAddr: string, cutoffDate: string): Promise<{balance: number; transfers: any[]}> {
  try {
    const allTx = await getAllTransfers(wallet, aTokenAddr);
    const bal = calcBalanceAt(allTx, wallet, cutoffDate);
    return { balance: bal, transfers: allTx };
  } catch { return { balance: 0, transfers: [] }; }
}

async function getAllTransfers(wallet: string, addr: string): Promise<any[]> {
  const walletLow = wallet.toLowerCase(), addrLow = addr.toLowerCase();
  let all = [], cursor = null;
  do {
    let path = `/${wallet}/erc20/transfers?chain=0x89&limit=100&order=DESC&contract_addresses[]=${addr}`;
    if (cursor) path += `&cursor=${encodeURIComponent(cursor)}`;
    let data;
    try { data = await moralis(path); } catch { break; }
    const page = (data.result || []).filter((t) =>
      t.address?.toLowerCase() === addrLow &&
      (t.to_address?.toLowerCase() === walletLow || t.from_address?.toLowerCase() === walletLow)
    );
    all = [...all, ...page];
    cursor = data.cursor || null;
  } while (cursor);
  return all;
}

function parseTs(ts: string): number {
  const s = ts.endsWith('Z') || ts.includes('+') ? ts : ts + 'Z';
  return new Date(s).getTime();
}

function calcBalanceAt(transfers: any[], wallet: string, cutoffDate: string): number {
  const cutoff = new Date(cutoffDate + 'T23:59:59.999Z').getTime();
  const walletLow = wallet.toLowerCase();
  let balance = 0;
  for (const t of transfers) {
    const ts = parseTs(t.block_timestamp);
    if (isNaN(ts) || ts > cutoff) continue;
    const decimals = parseInt(t.token_decimals || t.decimals || '18');
    const qty = parseFloat(t.value) / Math.pow(10, decimals);
    if (t.to_address?.toLowerCase() === walletLow) balance += qty;
    if (t.from_address?.toLowerCase() === walletLow) balance -= qty;
  }
  return Math.max(0, balance);
}

function getInboundUntil(transfers: any[], wallet: string, cutoffDate: string): any[] {
  const cutoff = new Date(cutoffDate + 'T23:59:59.999Z').getTime();
  const walletLow = wallet.toLowerCase();
  return transfers.filter((t) => {
    const ts = parseTs(t.block_timestamp);
    return !isNaN(ts) && ts <= cutoff && t.to_address?.toLowerCase() === walletLow;
  });
}

async function getEcbRate(date?: string): Promise<{rate: number; date: string}> {
  try {
    const url = date ? `${FRANKFURTER}/${date}?from=USD&to=EUR` : `${FRANKFURTER}/latest?from=USD&to=EUR`;
    const data = await (await fetch(url)).json();
    return { rate: data?.rates?.EUR ?? 0.92, date: date || today() };
  } catch { return { rate: 0.92, date: date || today() }; }
}

// ── PDF generado con formas vectoriales (sin imágenes externas) ──────────────
async function generarPDFMembretado(results: TokenResult[], meta: { ecbRate: number | null; ecbDate: string }, ejercicio: string, nifDeclarante: string, totalPorWallet: Record<string, number>) {
  if (!(window as any).jspdf) {
    await new Promise((res, rej) => {
      const s = document.createElement('script');
      s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      s.onload = () => res();
      s.onerror = () => rej(new Error('jsPDF load failed'));
      document.head.appendChild(s);
    });
  }
  const jsPDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
  if (!jsPDF) { alert('Error cargando jsPDF'); return; }

  const tcBce = meta.ecbRate || 1;
  const fecha = `31/12/${ejercicio}`;
  const PW = 297, PH = 210, ML = 10, MR = 10, MT = 12, MB = 12, CW = 277;
  const TEAL = [3, 105, 161];
  const TEAL_D = [2, 78, 120];
  const NAVY = [15, 23, 42];
  const GRAY = [100, 116, 139];
  const GRAY_L = [241, 245, 249];
  const GREEN = [16, 185, 129];
  const RED = [239, 68, 68];
  const AMBER = [245, 158, 11];
  const WHITE = [255, 255, 255];

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  let pageNum = 0;

  // ── Cabecera generada vectorialmente (sin imagen) ─────────────────────────
  const drawHeader = () => {
    pageNum++;
    // Banda superior teal
    doc.setFillColor(...TEAL_D);
    doc.rect(0, 0, PW, 11, 'F');
    // Bloque logo izq
    doc.setFillColor(...TEAL);
    doc.roundedRect(ML, 1.5, 28, 8, 1.5, 1.5, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('REENTAL', ML + 4, 6.5);
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'normal');
    doc.text('Real Estate Tokenizado', ML + 4, 9);
    // Texto derecho
    doc.setFontSize(6);
    doc.setTextColor(200, 230, 245);
    doc.text(`CERTIFICADO MODELO 720 · Ejercicio ${ejercicio} · Polygon PoS`, PW - MR, 5.5, { align: 'right' });
    doc.text('reental.co · AEAT · Art. 42 bis RGAT', PW - MR, 9, { align: 'right' });
    // Footer
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.4);
    doc.line(ML, PH - MB + 2, PW - MR, PH - MB + 2);
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.text('Reental · Certificado Modelo 720 · Documento generado automáticamente · Confidencial', ML, PH - MB + 5);
    doc.setTextColor(...TEAL);
    doc.text(`Pág. ${pageNum}`, PW - MR, PH - MB + 5, { align: 'right' });
  };

  // ── Sello vectorial (badge) en esquina sup derecha ────────────────────────
  const drawSeal = () => {
    const sx = PW - MR - 20, sy = MT - 2;
    doc.setFillColor(2, 78, 120);
    doc.roundedRect(sx, sy, 20, 14, 2, 2, 'F');
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.5);
    doc.roundedRect(sx + 0.5, sy + 0.5, 19, 13, 1.8, 1.8, 'D');
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...WHITE);
    doc.text('✓ CERTIFICADO', sx + 10, sy + 5.5, { align: 'center' });
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 220, 240);
    doc.text('Blockchain Verified', sx + 10, sy + 8.5, { align: 'center' });
    doc.text('Polygon PoS', sx + 10, sy + 11.5, { align: 'center' });
  };

  const byWallet = {};
  for (const r of results) {
    if (!byWallet[r.walletAddr]) byWallet[r.walletAddr] = [];
    byWallet[r.walletAddr].push(r);
  }
  const totalEur = results.reduce((s, r) => s + r.valorEur, 0);
  const fmt = (n) => n.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const entries = Object.entries(byWallet);

  entries.forEach(([walletAddr, wResults], wi) => {
    if (wi > 0) doc.addPage('a4', 'landscape');
    drawHeader();
    drawSeal();
    const wLabel = wResults[0]?.walletLabel || walletAddr;
    const wTotal = totalPorWallet[walletAddr] || 0;
    const declara = wTotal >= 50000;
    let y = MT + 4;

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text('CERTIFICADO DE INVERSIÓN — MODELO 720', ML, y);
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...GRAY);
    doc.text(`Declaración informativa de bienes en el exterior · Ejercicio ${ejercicio}`, ML, y);
    y += 3;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.6);
    doc.line(ML, y, PW - MR - 24, y);
    y += 4;

    const metas = [
      ['NIF Declarante', nifDeclarante || '—'],
      ['Wallet', wLabel],
      ['Dirección', walletAddr.slice(0, 22) + '…'],
      ['Fecha Ref.', fecha],
      ['TC BCE', `1 USD = ${tcBce.toFixed(4)}`],
      ['Obligación M720', declara ? 'SÍ ⚠' : 'NO ✓'],
      ['Total Cartera', `€ ${fmt(wTotal)}`],
    ];
    const bH = 11, bW = CW / metas.length;
    doc.setFillColor(...GRAY_L);
    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.3);
    doc.roundedRect(ML, y - 1, CW, bH, 2, 2, 'FD');
    metas.forEach(([lbl, val], i) => {
      const x = ML + i * bW + 2;
      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...TEAL);
      doc.text(lbl, x, y + 3.5);
      doc.setFont('helvetica', 'bold');
      if (lbl === 'Obligación M720') doc.setTextColor(...(declara ? AMBER : GREEN));
      else if (lbl === 'Total Cartera') doc.setTextColor(...GREEN);
      else doc.setTextColor(...NAVY);
      doc.setFontSize(7.5);
      doc.text(String(val), x, y + 8.5, { maxWidth: bW - 3 });
    });
    y += bH + 4;

    const cols: Array<{h:string;w:number;k:string;a:'left'|'center'|'right';bold?:boolean;tc?:number[];pnl?:boolean;decl?:boolean}> = [
      { h: 'Token', w: 14, k: 'tokenId', a: 'center', bold: true, tc: TEAL_D },
      { h: 'Inmueble', w: 36, k: 'inmueble', a: 'left' },
      { h: 'Mon.', w: 9, k: 'moneda', a: 'center' },
      { h: 'Saldo 31/12', w: 18, k: 'balance', a: 'right' },
      { h: 'Val. EUR', w: 22, k: 'valorEur', a: 'right', bold: true, tc: NAVY },
      { h: 'Coste Adq.', w: 22, k: 'coste', a: 'right' },
      { h: 'P&L EUR', w: 18, k: 'pnl', a: 'right', pnl: true },
      { h: 'TC BCE', w: 13, k: 'tc', a: 'center' },
      { h: '1ª Adq.', w: 18, k: 'fecha', a: 'center' },
      { h: 'Ops', w: 8, k: 'ops', a: 'center' },
      { h: 'Aave', w: 10, k: 'aave', a: 'center' },
      { h: 'Declara', w: 14, k: 'decl', a: 'center', decl: true },
    ];
    const totalCW = cols.reduce((s, c) => s + c.w, 0);
    const sc = CW / totalCW;
    const RC = cols.map((c) => ({ ...c, w: c.w * sc }));
    const RH = 5.5, HH = 7;

    const drawHead = (yy) => {
      doc.setFillColor(...TEAL_D);
      doc.rect(ML, yy, CW, HH, 'F');
      let cx = ML;
      RC.forEach((col) => {
        doc.setFontSize(7);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(255, 255, 255);
        const tx = col.a === 'right' ? cx + col.w - 1 : col.a === 'center' ? cx + col.w / 2 : cx + 1.5;
        doc.text(col.h, tx, yy + 4.8, { align: (col.a === 'left' ? 'left' : col.a) as 'left' | 'center' | 'right' });
        cx += col.w;
      });
      return yy + HH;
    };
    y = drawHead(y);

    wResults.forEach((r, ri) => {
      if (y + RH > PH - MB - 10) {
        doc.addPage('a4', 'landscape');
        drawHeader();
        y = MT + 4;
        y = drawHead(y);
      }
      const pnl = r.valorEur - r.valorAdqEur;
      const tc = r.llc.moneda === 'USD' ? tcBce.toFixed(4) : '—';
      const vals = {
        tokenId: r.llc.tokenId, inmueble: r.llc.inmueble, moneda: r.llc.moneda,
        balance: fmt(r.balance), valorEur: `€ ${fmt(r.valorEur)}`, coste: `€ ${fmt(r.valorAdqEur)}`,
        pnl: `€ ${fmt(pnl)}`, tc, fecha: r.fechaPrimeraAdq || '—', ops: String(r.numOperaciones),
        aave: r.enAave ? 'Aave' : '', decl: (totalPorWallet[r.walletAddr] || 0) >= 50000 ? 'SÍ' : 'NO',
      };
      doc.setFillColor(...(ri % 2 === 0 ? GRAY_L : [255, 255, 255]));
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, RH, 'FD');
      let cx = ML;
      RC.forEach((col) => {
        const val = vals[col.k] || '';
        doc.setFontSize(7);
        if (col.pnl) { doc.setFont('helvetica', 'bold'); doc.setTextColor(...(pnl >= 0 ? GREEN : RED)); }
        else if (col.decl) { const d = (totalPorWallet[r.walletAddr] || 0) >= 50000; doc.setFont('helvetica', 'bold'); doc.setTextColor(...(d ? AMBER : GREEN)); }
        else if (col.bold) { doc.setFont('helvetica', 'bold'); doc.setTextColor(...(col.tc || NAVY)); }
        else { doc.setFont('helvetica', 'normal'); doc.setTextColor(...GRAY); }
        const tx = col.a === 'right' ? cx + col.w - 1 : col.a === 'center' ? cx + col.w / 2 : cx + 1.5;
        doc.text(val, tx, y + RH - 1.2, { align: (col.a === 'left' ? 'left' : col.a) as 'left' | 'center' | 'right', maxWidth: col.w - 1 });
        cx += col.w;
      });
      y += RH;
    });

    // Total row
    doc.setFillColor(...NAVY);
    doc.rect(ML, y, CW, RH + 1, 'F');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL — ${wResults.length} posiciones`, ML + 2, y + RH - 0.5);
    doc.setTextColor(...GREEN);
    doc.text(`€ ${fmt(wTotal)}`, PW - MR - 2, y + RH - 0.5, { align: 'right' });
    y += RH + 4;

    if (y + 8 < PH - MB) {
      doc.setFontSize(6.2);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...GRAY);
      doc.text(
        'Nota legal: Certificado generado automáticamente desde blockchain Polygon. Valoración al valor nominal $100/€100 por token (Art. 42 bis RGAT). TC BCE al 31/12 del ejercicio. Documento informativo; no sustituye asesoramiento fiscal profesional.',
        ML, y, { maxWidth: CW - 26 }
      );
    }
  });

  // Resumen global
  if (entries.length > 1) {
    doc.addPage('a4', 'landscape');
    drawHeader();
    let y = MT + 4;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...NAVY);
    doc.text(`RESUMEN GLOBAL — EJERCICIO ${ejercicio}`, ML, y);
    y += 8;
    const sC: Array<{h:string;w:number}> = [{ h: 'Wallet', w: 40 }, { h: 'Dirección', w: 65 }, { h: 'Posiciones', w: 25 }, { h: 'Total EUR', w: 45 }, { h: 'Obligación M720', w: 45 }];
    const sCW = sC.reduce((s, c) => s + c.w, 0);
    const sSc = CW / sCW;
    doc.setFillColor(...TEAL_D);
    doc.rect(ML, y, CW, 7, 'F');
    let sx = ML;
    sC.forEach((c) => {
      doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text(c.h, sx + (c.w * sSc) / 2, y + 5, { align: 'center' });
      sx += c.w * sSc;
    });
    y += 7;
    entries.forEach(([wA, wR], ri) => {
      const wT = totalPorWallet[wA] || 0;
      const d = wT >= 50000;
      doc.setFillColor(...(ri % 2 === 0 ? GRAY_L : [255, 255, 255]));
      doc.setDrawColor(226, 232, 240); doc.setLineWidth(0.2);
      doc.rect(ML, y, CW, 6, 'FD');
      const sv = [wR[0]?.walletLabel || '', wA.slice(0, 30) + '…', String(wR.length), `€ ${fmt(wT)}`, d ? 'SÍ ⚠' : 'NO ✓'];
      let sx2 = ML;
      sC.forEach((c, i) => {
        doc.setFontSize(7.5);
        if (i === 3) { doc.setFont('helvetica', 'bold'); doc.setTextColor(...GREEN); }
        else if (i === 4) { doc.setFont('helvetica', 'bold'); doc.setTextColor(...(d ? AMBER : GREEN)); }
        else { doc.setFont('helvetica', 'normal'); doc.setTextColor(...NAVY); }
        doc.text(sv[i], sx2 + (c.w * sSc) / 2, y + 4.2, { align: 'center', maxWidth: c.w * sSc - 2 });
        sx2 += c.w * sSc;
      });
      y += 6;
    });
    y += 2;
    doc.setFillColor(...NAVY);
    doc.rect(ML, y, CW, 7, 'F');
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text(`TOTAL GLOBAL: ${results.length} posiciones`, ML + 3, y + 5);
    doc.setTextColor(...GREEN);
    doc.text(`€ ${fmt(totalEur)}`, PW - MR - 3, y + 5, { align: 'right' });
  }

  doc.save(`Reental_Modelo720_${ejercicio}_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function Modelo720() {
  const [ejercicio, setEjercicio] = useState<number>(EJERCICIOS[0]);
  const [catalog, setCatalog] = useState<LLCRow[]>(CATALOG_DEFAULT);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [newAddr, setNewAddr] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [results, setResults] = useState<TokenResult[]>([]);
  const [meta, setMeta] = useState<{ ecbRate: number | null; ecbDate: string | null }>({ ecbRate: null, ecbDate: null });
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('resumen');
  const [nif, setNif] = useState('');
  const [showAdmin, setShowAdmin] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [newTok, setNewTok] = useState<Partial<LLCRow>>({ moneda: 'USD', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' });

  const fechaRef = `${ejercicio}-12-31`;
  const activeCatalog = catalog.filter((r) => r.tokenAddress.startsWith('0x'));
  const withAddr = activeCatalog.length;
  const withoutAddr = catalog.filter((r) => !r.tokenAddress.startsWith('0x')).length;

  const addWallet = () => {
    if (!newAddr.trim()) return;
    setWallets((p) => [...p, { id: Date.now(), address: newAddr.trim(), label: newLabel.trim() || short(newAddr.trim()) }]);
    setNewAddr(''); setNewLabel('');
  };

  const saveAddr = (tokenId) => {
    setCatalog((p) => p.map((r) => r.tokenId === tokenId ? { ...r, tokenAddress: editVal.trim().toLowerCase() } : r));
    setEditId(null); setEditVal('');
  };

  const addNewToken = () => {
    if (!newTok.tokenId?.trim() || !newTok.inmueble?.trim()) return;
    setCatalog((p) => [...p, {
      tokenId: newTok.tokenId.trim(),
      tokenAddress: (newTok.tokenAddress || '').trim().toLowerCase(),
      moneda: newTok.moneda || 'USD',
      inmueble: newTok.inmueble.trim(),
      ein: newTok.ein || '',
      constitucion: newTok.constitucion || '',
      direccion: newTok.direccion || '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134',
    }]);
    setNewTok({ moneda: 'USD', direccion: '201 Alhambra Circle, Suite 1050, Coral Gables, FL. US 33134' });
  };

  const fetchAll = useCallback(async () => {
    if (!activeCatalog.length) { setError('Añade token addresses en el panel Admin ⚙'); return; }
    if (!wallets.length) { setError('Añade al menos una wallet'); return; }
    setError(''); setLoading(true); setResults([]);
    setProgress(`TC BCE al 31/12/${ejercicio}...`);
    const { rate: tcBce } = await getEcbRate(fechaRef);
    setMeta({ ecbRate: tcBce, ecbDate: fechaRef });
    const rateCache = {};
    const getCachedRate = async (d) => {
      if (rateCache[d] !== undefined) return rateCache[d];
      const { rate } = await getEcbRate(d);
      return (rateCache[d] = rate);
    };
    const all = [];
    const catalogByAddr = {};
    for (const llc of activeCatalog) catalogByAddr[llc.tokenAddress.toLowerCase()] = llc;
    const catalogByAToken = {};
    for (const llc of activeCatalog) if (llc.aTokenAddress) catalogByAToken[llc.aTokenAddress.toLowerCase()] = llc;

    for (const w of wallets) {
      setProgress(`[${w.label}] Escaneando tokens al 31/12/${ejercicio}...`);
      const walletTokens = await getWalletTokensAtDate(w.address, fechaRef);
      await sleep(200);

      const directTokens = walletTokens.filter((t) => catalogByAddr[t.token_address?.toLowerCase()]);
      const aaveTokensKnown = walletTokens.filter((t) => catalogByAToken[t.token_address?.toLowerCase()]);
      const aaveTokensDynamic = walletTokens.filter((t) => {
        const addr = t.token_address?.toLowerCase();
        if (catalogByAddr[addr] || catalogByAToken[addr]) return false;
        return matchAaveTokenToCatalog(t, activeCatalog) !== null;
      });

      const processedLLCs = new Set();

      for (const tok of directTokens) {
        const llc = catalogByAddr[tok.token_address.toLowerCase()];
        if (processedLLCs.has(llc.tokenId)) continue;
        setProgress(`[${w.label}] ${llc.inmueble}...`);
        const allTransfers = await getAllTransfers(w.address, llc.tokenAddress);
        await sleep(120);
        const balanceDirecto = calcBalanceAt(allTransfers, w.address, fechaRef);
        let balanceAave = 0, aaveTransfers = [], aTokenAddr = null;
        aTokenAddr = getAaveATokenAddress(llc);
        if (aTokenAddr) {
          setProgress(`[${w.label}] ${llc.inmueble} — Aave...`);
          const aaveData = await getAaveBalanceAt(w.address, aTokenAddr, fechaRef);
          balanceAave = aaveData.balance; aaveTransfers = aaveData.transfers;
        }
        await sleep(100);
        const balance = balanceDirecto + balanceAave;
        if (balance < 0.0001) { processedLLCs.add(llc.tokenId); continue; }
        const valorEur = llc.moneda === 'USD' ? balance * VALOR_NOMINAL * tcBce : balance * VALOR_NOMINAL;
        const inboundD = getInboundUntil(allTransfers, w.address, fechaRef);
        const inboundA = aTokenAddr ? getInboundUntil(aaveTransfers, w.address, fechaRef) : [];
        const allInbound = [...inboundD, ...inboundA].sort((a, b) => parseTs(a.block_timestamp) - parseTs(b.block_timestamp));
        let valorAdqEur = 0, fechaPrimeraAdq = '';
        for (const t of allInbound) {
          const qty = parseFloat(t.value) / Math.pow(10, parseInt(t.token_decimals || '18'));
          const date = isoDate(t.block_timestamp);
          if (!fechaPrimeraAdq) fechaPrimeraAdq = date;
          const rate = llc.moneda === 'USD' ? await getCachedRate(date) : 1;
          valorAdqEur += qty * VALOR_NOMINAL * rate;
        }
        all.push({ tokenAddress: llc.tokenAddress, llc, balance, valorEur, valorAdqEur, fechaPrimeraAdq, numOperaciones: allInbound.length, walletLabel: w.label, walletAddr: w.address, enAave: balanceAave > 0.0001, balanceAave });
        processedLLCs.add(llc.tokenId);
      }

      for (const tok of aaveTokensKnown) {
        const llc = catalogByAToken[tok.token_address.toLowerCase()];
        if (processedLLCs.has(llc.tokenId)) continue;
        setProgress(`[${w.label}] ${llc.inmueble} (Aave)...`);
        const aaveData = await getAaveBalanceAt(w.address, tok.token_address, fechaRef);
        const balance = aaveData.balance;
        await sleep(100);
        if (balance < 0.0001) { processedLLCs.add(llc.tokenId); continue; }
        const valorEur = llc.moneda === 'USD' ? balance * VALOR_NOMINAL * tcBce : balance * VALOR_NOMINAL;
        const allInbound = getInboundUntil(aaveData.transfers, w.address, fechaRef);
        let valorAdqEur = 0, fechaPrimeraAdq = '';
        for (const t of allInbound) {
          const qty = parseFloat(t.value) / Math.pow(10, parseInt(t.token_decimals || '18'));
          const date = isoDate(t.block_timestamp);
          if (!fechaPrimeraAdq) fechaPrimeraAdq = date;
          const rate = llc.moneda === 'USD' ? await getCachedRate(date) : 1;
          valorAdqEur += qty * VALOR_NOMINAL * rate;
        }
        all.push({ tokenAddress: llc.tokenAddress, llc, balance, valorEur, valorAdqEur, fechaPrimeraAdq, numOperaciones: allInbound.length, walletLabel: w.label, walletAddr: w.address, enAave: true, balanceAave: balance });
        processedLLCs.add(llc.tokenId);
      }

      for (const tok of aaveTokensDynamic) {
        const llc = matchAaveTokenToCatalog(tok, activeCatalog);
        if (processedLLCs.has(llc.tokenId)) continue;
        setProgress(`[${w.label}] ${llc.inmueble} (Aave dinámico)...`);
        const aaveData = await getAaveBalanceAt(w.address, tok.token_address, fechaRef);
        const balance = aaveData.balance;
        await sleep(100);
        if (balance < 0.0001) { processedLLCs.add(llc.tokenId); continue; }
        const valorEur = llc.moneda === 'USD' ? balance * VALOR_NOMINAL * tcBce : balance * VALOR_NOMINAL;
        const allInbound = getInboundUntil(aaveData.transfers, w.address, fechaRef);
        let valorAdqEur = 0, fechaPrimeraAdq = '';
        for (const t of allInbound) {
          const qty = parseFloat(t.value) / Math.pow(10, parseInt(t.token_decimals || '18'));
          const date = isoDate(t.block_timestamp);
          if (!fechaPrimeraAdq) fechaPrimeraAdq = date;
          const rate = llc.moneda === 'USD' ? await getCachedRate(date) : 1;
          valorAdqEur += qty * VALOR_NOMINAL * rate;
        }
        all.push({ tokenAddress: llc.tokenAddress, llc, balance, valorEur, valorAdqEur, fechaPrimeraAdq, numOperaciones: allInbound.length, walletLabel: w.label, walletAddr: w.address, enAave: true, balanceAave: balance });
        processedLLCs.add(llc.tokenId);
      }
    }

    setResults(all.sort((a, b) => b.valorEur - a.valorEur));
    setLoading(false); setProgress('');
  }, [activeCatalog, wallets, ejercicio, fechaRef]);

  const dl = (content: string, name: string, type = 'text/csv;charset=utf-8;') => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([content], { type }));
    a.download = name; a.click();
  };

  const exportCSV = () => {
    const h = 'Titular;Wallet;Token ID;Inmueble;EIN;Fecha Constitucion;Moneda;Saldo 31/12;Val. EUR 31/12;Coste Adq. EUR;P&L EUR;TC BCE 31/12;Fecha 1a Adq.;Operaciones;Declarable;Aave Colateral\n';
    const rows = results.map((r) => [
      r.walletLabel, r.walletAddr, r.llc.tokenId, r.llc.inmueble, r.llc.ein, r.llc.constitucion, r.llc.moneda,
      r.balance.toFixed(6).replace('.', ','), r.valorEur.toFixed(2).replace('.', ','), r.valorAdqEur.toFixed(2).replace('.', ','),
      (r.valorEur - r.valorAdqEur).toFixed(2).replace('.', ','), meta.ecbRate?.toFixed(4).replace('.', ',') || 'N/D',
      r.fechaPrimeraAdq, r.numOperaciones, totalPorWallet[r.walletAddr] >= 50000 ? 'SI' : 'NO', r.enAave ? `Aave:${fmtNum(r.balanceAave, 4)}` : '',
    ].join(';'));
    dl('\uFEFF' + h + rows.join('\n'), `Modelo720_${ejercicio}_${today()}.csv`);
  };

  const exportBOE = () => {
    if (!nif.trim()) { setError('Introduce tu NIF para generar el fichero BOE'); return; }
    const walletAddrsDeclarantes = new Set(walletsDeclaran.map(([addr]) => addr));
    const dec = results.filter((r) => walletAddrsDeclarantes.has(r.walletAddr));
    if (!dec.length) { setError('La suma total de la cartera no supera los 50.000€'); return; }
    const hdr = 'NIF_Declarante|Ejercicio|Tipo_Registro|Clave_Bien|Subclave_Bien|Codigo_Pais|Identificacion_Valor|Nombre_Emisor|Direccion_Emisor|Numero_Valores|Valor_Adquisicion|Fecha_Adquisicion|Valor_31_12|Fecha_Extincion|Entidad_Depositaria|Porcentaje_Titularidad|Codigo_Municipio|Observaciones';
    const lines = dec.map((r) => [
      nif.trim().toUpperCase(), ejercicio, 2, 'V', 2, r.llc.moneda === 'EUR' ? 'ES' : 'US', r.llc.tokenId, r.llc.inmueble,
      r.llc.direccion.slice(0, 50), Math.round(r.balance), r.valorAdqEur.toFixed(2), r.fechaPrimeraAdq, r.valorEur.toFixed(2),
      '', 'Custodia directa del titular', '', '', '',
      `Token Reental ${r.llc.tokenId} Polygon${r.enAave ? ' - parcialmente colateralizado Aave v3' : ''}`,
    ].join('|'));
    dl(hdr + '\n' + lines.join('\n'), `Modelo720_${ejercicio}_BOE_${nif.trim()}_${today()}.txt`, 'text/plain;charset=utf-8;');
  };

  const totalEur = results.reduce((s, r) => s + r.valorEur, 0);
  const totalPorWallet: Record<string, number> = {};
  results.forEach((r) => { totalPorWallet[r.walletAddr] = (totalPorWallet[r.walletAddr] || 0) + r.valorEur; });
  const walletsDeclaran: [string, number][] = Object.entries(totalPorWallet).filter(([, v]) => v >= 50000);
  const hayObligacion = walletsDeclaran.length > 0;
  const filteredAdmin = catalog.filter((r) => !adminSearch || r.tokenId.toLowerCase().includes(adminSearch.toLowerCase()) || r.inmueble.toLowerCase().includes(adminSearch.toLowerCase()));

  const S: Record<string, React.CSSProperties> = {
    card: { background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '1.25rem', marginBottom: '1rem' },
    inp: { background: '#060b18', border: '1px solid #1e293b', borderRadius: 6, padding: '0.45rem 0.65rem', color: '#e2e8f0', fontFamily: 'inherit', fontSize: '0.78rem', width: '100%' },
    th: { textAlign: 'left', padding: '0.45rem 0.65rem', color: '#475569', fontWeight: 400, fontSize: '0.64rem', textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: '1px solid #1e293b', whiteSpace: 'nowrap' },
    td: { padding: '0.45rem 0.65rem', borderBottom: '1px solid #0a0f1e', fontSize: '0.76rem' },
  };

  return (
    <div style={{ fontFamily: "'IBM Plex Mono',monospace", background: '#060b18', minHeight: '100vh', color: '#e2e8f0', padding: '1.5rem' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;600&family=Space+Grotesk:wght@500;600;700&display=swap');
        *{box-sizing:border-box} input,button,select{outline:none;font-family:inherit}
        ::-webkit-scrollbar{width:5px;height:5px}::-webkit-scrollbar-track{background:#060b18}::-webkit-scrollbar-thumb{background:#1e293b;border-radius:3px}
        .rh:hover{background:rgba(99,179,237,0.04)!important}
        .bp{background:linear-gradient(135deg,#2563eb,#0891b2);border:none;color:#fff;padding:0.5rem 1.1rem;border-radius:6px;cursor:pointer;font-size:0.8rem;font-weight:600;transition:opacity .2s}.bp:hover{opacity:.85}.bp:disabled{opacity:.35;cursor:not-allowed}
        .bg{background:transparent;border:1px solid #1e293b;color:#64748b;padding:0.4rem 0.8rem;border-radius:6px;cursor:pointer;font-size:0.74rem;transition:all .2s}.bg:hover{border-color:#2563eb;color:#e2e8f0}
        .tab{padding:0.35rem 0.8rem;border-radius:6px;cursor:pointer;font-size:0.74rem;border:1px solid transparent;background:transparent;transition:all .2s}
        @keyframes spin{to{transform:rotate(360deg)}}.sp{width:12px;height:12px;border:2px solid #1e293b;border-top-color:#2563eb;border-radius:50%;animation:spin .6s linear infinite;display:inline-block;vertical-align:middle}
        @keyframes fi{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}.fi{animation:fi .3s ease forwards}
        @keyframes pulse{0%,100%{opacity:1}50%{opacity:.4}}.pulse{animation:pulse 1.4s ease infinite}
        .tag{display:inline-block;padding:0.07rem 0.4rem;border-radius:4px;font-size:0.65rem;font-weight:600}
        input:focus,select:focus{border-color:#2563eb!important}
        .ai{background:#060b18;border:1px solid #1e293b;border-radius:5px;padding:0.32rem 0.5rem;color:#e2e8f0;font-family:inherit;font-size:0.73rem;width:100%}.ai:focus{border-color:#2563eb;outline:none}
      `}</style>

      <div style={{ maxWidth: 1380, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.1rem', flexWrap: 'wrap', gap: '0.65rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: 33, height: 33, borderRadius: 8, background: 'linear-gradient(135deg,#2563eb,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🏛️</div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#f1f5f9' }}>Modelo 720</span>
                <span className="tag" style={{ background: 'rgba(37,99,235,0.15)', color: '#60a5fa', border: '1px solid rgba(37,99,235,0.3)' }}>AEAT · Polygon</span>
                <span className="tag" style={{ background: 'rgba(99,102,241,0.12)', color: '#a78bfa', border: '1px solid rgba(99,102,241,0.25)' }}>Reental.co</span>
              </div>
              <p style={{ color: '#475569', fontSize: '0.68rem', margin: '0.1rem 0 0' }}>
                Valor nominal {VALOR_NOMINAL} USD/EUR · TC BCE 31/12/{ejercicio} · {withAddr} tokens activos / {catalog.length} en catálogo
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="bg" onClick={() => setShowAdmin(!showAdmin)} style={{ borderColor: showAdmin ? 'rgba(245,158,11,0.5)' : undefined, color: showAdmin ? '#f59e0b' : undefined }}>
              ⚙ Admin{withoutAddr > 0 && <span style={{ background: '#f59e0b', color: '#000', borderRadius: 10, padding: '0 5px', fontSize: '0.62rem', marginLeft: 5, fontWeight: 700 }}>{withoutAddr}</span>}
            </button>
            {results.length > 0 && <>
              <button className="bg" onClick={exportCSV}>↓ CSV</button>
              <button className="bg" onClick={exportBOE} style={{ borderColor: 'rgba(245,158,11,0.35)', color: '#f59e0b' }}>↓ BOE .txt</button>
              <button className="bg" onClick={() => generarPDFMembretado(results, {...meta, ecbDate: meta.ecbDate ?? ''}, String(ejercicio), nif, totalPorWallet)} style={{ borderColor: 'rgba(239,68,68,0.45)', color: '#f87171', fontWeight: 600 }}>↓ PDF</button>
            </>}
          </div>
        </div>

        {/* Admin */}
        {showAdmin && (
          <div style={{ ...S.card, border: '1px solid rgba(245,158,11,0.2)', background: '#0b1320' }} className="fi">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, color: '#f59e0b', fontSize: '0.88rem' }}>⚙ Catálogo de tokens</span>
                <span style={{ color: '#475569', fontSize: '0.68rem', marginLeft: '0.75rem' }}>
                  <span style={{ color: '#34d399' }}>{withAddr} activos</span> · <span style={{ color: '#f87171' }}>{withoutAddr} sin address</span>
                </span>
              </div>
              <input className="ai" value={adminSearch} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setAdminSearch(e.target.value)} placeholder="Buscar..." style={{ width: 170 }} />
            </div>
            <div style={{ overflowX: 'auto', maxHeight: 380, overflowY: 'auto', marginBottom: '0.85rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, background: '#0b1320', zIndex: 1 }}>
                  <tr>{['Token ID', 'Inmueble', 'Moneda', 'Token Address 0x...', 'Estado', ''].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                </thead>
                <tbody>
                  {filteredAdmin.map((r) => (
                    <tr key={r.tokenId} className="rh">
                      <td style={S.td}><span className="tag" style={{ background: 'rgba(8,145,178,0.12)', color: '#22d3ee', border: '1px solid rgba(8,145,178,0.2)' }}>{r.tokenId}</span></td>
                      <td style={{ ...S.td, color: '#e2e8f0', whiteSpace: 'nowrap' }}>{r.inmueble}</td>
                      <td style={S.td}><span className="tag" style={{ background: r.moneda === 'EUR' ? 'rgba(99,102,241,0.15)' : 'rgba(8,145,178,0.1)', color: r.moneda === 'EUR' ? '#a78bfa' : '#22d3ee', border: `1px solid ${r.moneda === 'EUR' ? 'rgba(99,102,241,0.3)' : 'rgba(8,145,178,0.2)'}` }}>{r.moneda}</span></td>
                      <td style={{ ...S.td, minWidth: 320 }}>
                        {editId === r.tokenId ? (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <input className="ai" value={editVal} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setEditVal(e.target.value)} placeholder="0x..." style={{ flex: 1 }} autoFocus onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && saveAddr(r.tokenId)} />
                            <button className="bp" style={{ padding: '0.22rem 0.6rem', fontSize: '0.7rem' }} onClick={() => saveAddr(r.tokenId)}>✓</button>
                            <button className="bg" style={{ padding: '0.22rem 0.55rem', fontSize: '0.7rem' }} onClick={() => setEditId(null)}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                            <span style={{ color: r.tokenAddress ? '#60a5fa' : '#1e293b', fontFamily: 'monospace', fontSize: '0.69rem', flex: 1 }}>{r.tokenAddress || '— pendiente —'}</span>
                            <button className="bg" style={{ padding: '0.18rem 0.5rem', fontSize: '0.67rem' }} onClick={() => { setEditId(r.tokenId); setEditVal(r.tokenAddress); }}>✎ editar</button>
                          </div>
                        )}
                      </td>
                      <td style={S.td}>
                        {r.tokenAddress.startsWith('0x')
                          ? <span className="tag" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.2)' }}>✓ activo</span>
                          : <span className="tag" style={{ background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>pendiente</span>}
                      </td>
                      <td style={S.td}><button onClick={() => setCatalog((p) => p.filter((x) => x.tokenId !== r.tokenId))} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer' }}>🗑</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ background: 'rgba(37,99,235,0.05)', border: '1px solid rgba(37,99,235,0.15)', borderRadius: 8, padding: '0.8rem' }}>
              <div style={{ fontSize: '0.65rem', color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.55rem' }}>+ Añadir nuevo token</div>
              <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr 65px 200px 1fr 1fr auto', gap: '0.35rem', alignItems: 'end' }}>
                {[{ label: 'Token ID', field: 'tokenId', ph: 'JAX-6' }, { label: 'Inmueble', field: 'inmueble', ph: 'Jacksonville 6' }, { label: 'Moneda', field: 'moneda', ph: '', isSelect: true }, { label: 'Token Address', field: 'tokenAddress', ph: '0x...' }, { label: 'EIN', field: 'ein', ph: '93-0000000' }, { label: 'Constitución', field: 'constitucion', ph: 'dd/mm/aaaa' }].map((f) => (
                  <div key={f.field}>
                    <div style={{ fontSize: '0.58rem', color: '#334155', marginBottom: '0.18rem' }}>{f.label}</div>
                    {f.isSelect
                      ? <select className="ai" value={newTok.moneda || 'USD'} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setNewTok((p) => ({ ...p, moneda: e.target.value as 'USD' | 'EUR' }))}><option value="USD">USD</option><option value="EUR">EUR</option></select>
                      : <input className="ai" placeholder={f.ph} value={(newTok as any)[f.field] || ''} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setNewTok((p) => ({ ...p, [f.field as string]: e.target.value }))} />}
                  </div>
                ))}
                <button className="bp" onClick={addNewToken} style={{ padding: '0.38rem 0.85rem', fontSize: '0.76rem', alignSelf: 'end' }}>+ Añadir</button>
              </div>
            </div>
          </div>
        )}

        {/* Ejercicio + TC + NIF */}
        <div style={{ ...S.card, background: 'rgba(37,99,235,0.04)', border: '1px solid rgba(37,99,235,0.16)', padding: '0.8rem 1.2rem', display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.28rem' }}>Ejercicio fiscal</div>
            <div style={{ display: 'flex', gap: '0.32rem' }}>
              {EJERCICIOS.map((y) => (
                <button key={y} onClick={() => { setEjercicio(y); setResults([]); }} style={{ padding: '0.25rem 0.7rem', borderRadius: 6, border: '1px solid', fontSize: '0.77rem', fontWeight: 600, cursor: 'pointer', background: ejercicio === y ? 'rgba(37,99,235,0.25)' : 'transparent', color: ejercicio === y ? '#60a5fa' : '#475569', borderColor: ejercicio === y ? 'rgba(37,99,235,0.5)' : '#1e293b' }}>{y}</button>
              ))}
            </div>
          </div>
          <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '1.2rem' }}>
            <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.12rem' }}>Fecha referencia</div>
            <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#f59e0b', fontSize: '0.92rem' }}>31/12/{ejercicio}</div>
            <div style={{ fontSize: '0.6rem', color: '#334155' }}>Art. 42 bis RGAT</div>
          </div>
          {meta.ecbRate && (
            <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '1.2rem' }}>
              <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.12rem' }}>TC BCE 31/12/{ejercicio}</div>
              <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#34d399', fontSize: '0.92rem' }}>1 USD = {fmtNum(meta.ecbRate, 4)} EUR</div>
              <div style={{ fontSize: '0.6rem', color: '#334155' }}>frankfurter.app</div>
            </div>
          )}
          <div style={{ borderLeft: '1px solid #1e293b', paddingLeft: '1.2rem' }}>
            <div style={{ fontSize: '0.6rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.22rem' }}>NIF declarante (BOE)</div>
            <input value={nif} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setNif(e.target.value.toUpperCase())} placeholder="12345678A" style={{ ...S.inp, width: 130, fontSize: '0.82rem', fontWeight: 600 }} />
          </div>
        </div>

        {/* Wallets */}
        <div style={S.card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <div>
              <div style={{ fontSize: '0.66rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Wallets del inversor</div>
              <div style={{ fontSize: '0.65rem', color: '#334155', marginTop: '0.1rem' }}>
                {withAddr > 0 ? `Consultará ${withAddr} tokens activos del catálogo` : <span style={{ color: '#f59e0b' }}>⚠ Añade token addresses en ⚙ Admin para activar la consulta</span>}
              </div>
            </div>
            <button className="bp" onClick={fetchAll} disabled={loading} style={{ height: 37, minWidth: 172 }}>
              {loading ? <><span className="sp" /><span style={{ marginLeft: 7 }}>Consultando...</span></> : `► Consultar ${ejercicio}`}
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.32rem', marginBottom: '0.6rem' }}>
            {wallets.length === 0 && <div style={{ padding: '0.7rem', background: 'rgba(37,99,235,0.04)', border: '1px dashed #1e293b', borderRadius: 6, color: '#334155', fontSize: '0.7rem', textAlign: 'center' }}>Introduce la wallet 0x... del inversor en Polygon</div>}
            {wallets.map((w) => (
              <div key={w.id} style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', background: '#060b18', border: '1px solid #1e293b', borderRadius: 6, padding: '0.32rem 0.65rem' }}>
                <span style={{ color: '#2563eb', fontSize: '0.68rem' }}>◈</span>
                <span style={{ color: '#94a3b8', fontSize: '0.7rem', minWidth: 105 }}>{w.label}</span>
                <span style={{ color: '#334155', fontSize: '0.7rem', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.address}</span>
                <button onClick={() => setWallets((p) => p.filter((x) => x.id !== w.id))} style={{ background: 'none', border: 'none', color: '#334155', cursor: 'pointer', padding: 0 }}>✕</button>
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '135px 1fr auto', gap: '0.4rem' }}>
            <input value={newLabel} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setNewLabel(e.target.value)} placeholder="Nombre titular" style={S.inp} />
            <input value={newAddr} onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setNewAddr(e.target.value)} placeholder="0x... wallet Polygon" style={S.inp} onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && addWallet()} />
            <button className="bg" onClick={addWallet}>+ Añadir</button>
          </div>
          {error && <div style={{ marginTop: '0.6rem', padding: '0.48rem 0.8rem', background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, color: '#f87171', fontSize: '0.72rem' }}>⚠️ {error}</div>}
          {loading && progress && <div className="pulse" style={{ marginTop: '0.45rem', color: '#60a5fa', fontSize: '0.69rem' }}>⟳ {progress}</div>}
        </div>

        {/* Resultados */}
        {results.length > 0 && (
          <div className="fi">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: '0.55rem', marginBottom: '0.8rem' }}>
              {[
                { label: 'Tokens con saldo', value: results.length, color: '#34d399' },
                { label: `Val. 31/12/${ejercicio}`, value: fmtEur(totalEur), color: '#f59e0b' },
                { label: 'Obligación Modelo 720', value: hayObligacion ? 'SÍ ⚠' : 'NO ✓', color: hayObligacion ? '#f87171' : '#34d399' },
                { label: `TC BCE 31/12/${ejercicio}`, value: meta.ecbRate ? fmtNum(meta.ecbRate, 4) : '—', color: '#a78bfa' },
                { label: 'Catálogo activo', value: `${withAddr} / ${catalog.length}`, color: '#60a5fa' },
              ].map((k) => (
                <div key={k.label} style={{ ...S.card, marginBottom: 0, padding: '0.65rem 0.85rem' }}>
                  <div style={{ fontSize: '0.61rem', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.15rem' }}>{k.label}</div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: '0.98rem', fontWeight: 700, color: k.color }}>{k.value}</div>
                </div>
              ))}
            </div>

            {hayObligacion && (
              <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.28)', borderRadius: 10, padding: '0.7rem 0.95rem', marginBottom: '0.8rem', display: 'flex', gap: '0.7rem' }}>
                <span>🚨</span>
                <div>
                  <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 600, color: '#f87171', fontSize: '0.83rem' }}>Obligación de presentar Modelo 720 — ejercicio {ejercicio}</div>
                  <div style={{ color: '#94a3b8', fontSize: '0.7rem', marginTop: '0.18rem' }}>
                    {walletsDeclaran.map(([addr, total]) => `${results.find((r) => r.walletAddr === addr)?.walletLabel || addr.slice(0, 8)} — Total: ${fmtEur(total)}`).join('  ·  ')}
                    <br /><span style={{ fontSize: '0.67rem', color: '#64748b' }}>La suma de todos los tokens supera 50.000 € — todos deben declararse</span>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.35rem', marginBottom: '0.6rem' }}>
              {[['resumen', 'Resumen 720'], ['llc', 'Detalle LLC']].map(([id, lbl]) => (
                <button key={id} className="tab" onClick={() => setActiveTab(id)} style={{ background: activeTab === id ? 'rgba(37,99,235,0.18)' : 'transparent', color: activeTab === id ? '#60a5fa' : '#475569', borderColor: activeTab === id ? 'rgba(37,99,235,0.4)' : 'transparent' }}>{lbl}</button>
              ))}
            </div>

            {activeTab === 'resumen' && (
              <div style={S.card}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Titular', 'Token', 'Inmueble', 'EIN', 'Mon.', 'Saldo 31/12', 'Cálculo', 'Val. EUR 31/12', 'Coste adq.', 'P&L EUR', 'Declarable'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => {
                        const pl = r.valorEur - r.valorAdqEur;
                        return (
                          <tr key={i} className="rh" style={{ background: hayObligacion ? 'rgba(239,68,68,0.02)' : 'transparent' }}>
                            <td style={{ ...S.td, color: '#64748b' }}>{r.walletLabel}</td>
                            <td style={S.td}><span className="tag" style={{ background: 'rgba(8,145,178,0.12)', color: '#22d3ee', border: '1px solid rgba(8,145,178,0.2)' }}>{r.llc.tokenId}</span></td>
                            <td style={{ ...S.td, color: '#e2e8f0', fontWeight: 600, whiteSpace: 'nowrap' }}>{r.llc.inmueble}</td>
                            <td style={{ ...S.td, color: '#7c3aed', fontFamily: 'monospace', fontSize: '0.67rem' }}>{r.llc.ein}</td>
                            <td style={S.td}><span className="tag" style={{ background: r.llc.moneda === 'EUR' ? 'rgba(99,102,241,0.15)' : 'rgba(8,145,178,0.1)', color: r.llc.moneda === 'EUR' ? '#a78bfa' : '#22d3ee', border: `1px solid ${r.llc.moneda === 'EUR' ? 'rgba(99,102,241,0.3)' : 'rgba(8,145,178,0.2)'}` }}>{r.llc.moneda}</span></td>
                            <td style={{ ...S.td, color: '#34d399', fontWeight: 600 }}>
                              {fmtNum(r.balance, 4)}
                              {r.enAave && <span title={`${fmtNum(r.balanceAave, 4)} en Aave`} style={{ marginLeft: 5, fontSize: '0.6rem', background: 'rgba(139,92,246,0.15)', color: '#a78bfa', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 3, padding: '0 4px', cursor: 'default' }}>⚡Aave</span>}
                            </td>
                            <td style={{ ...S.td, color: '#475569', fontSize: '0.67rem', whiteSpace: 'nowrap' }}>
                              {r.llc.moneda === 'USD' ? `${fmtNum(r.balance, 2)}×$${VALOR_NOMINAL}×${fmtNum(meta.ecbRate || 0, 4)}` : `${fmtNum(r.balance, 2)}×€${VALOR_NOMINAL}`}
                            </td>
                            <td style={{ ...S.td, fontWeight: 700, color: r.valorEur > 0 ? '#f59e0b' : '#1e293b' }}>{fmtEur(r.valorEur)}</td>
                            <td style={{ ...S.td, color: '#94a3b8' }}>{fmtEur(r.valorAdqEur)}</td>
                            <td style={{ ...S.td, fontWeight: 600, color: pl >= 0 ? '#34d399' : '#f87171' }}>{(pl >= 0 ? '+' : '') + fmtEur(pl)}</td>
                            <td style={S.td}>
                              {hayObligacion
                                ? <span className="tag" style={{ background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)' }}>SÍ 🚨</span>
                                : <span className="tag" style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.15)' }}>NO</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div style={{ marginTop: '0.7rem', padding: '0.45rem 0.7rem', background: '#060b18', borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.4rem' }}>
                  <span style={{ color: '#334155', fontSize: '0.65rem' }}>Valor nominal {VALOR_NOMINAL}/token · TC BCE 31/12/{ejercicio}: {meta.ecbRate ? `1 USD = ${fmtNum(meta.ecbRate, 4)} EUR` : 'N/D'} · frankfurter.app</span>
                  <span style={{ fontFamily: "'Space Grotesk',sans-serif", fontWeight: 700, color: '#f59e0b', fontSize: '0.92rem' }}>{fmtEur(totalEur)}</span>
                </div>
              </div>
            )}

            {activeTab === 'llc' && (
              <div style={S.card}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr>{['Token', 'Inmueble', 'EIN', 'Constitución', 'Mon.', 'Token Address', 'Saldo', 'Val. EUR 31/12', '1ª Adq.', 'Ops.'].map((h) => <th key={h} style={S.th}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {results.map((r, i) => (
                        <tr key={i} className="rh">
                          <td style={S.td}><span className="tag" style={{ background: 'rgba(8,145,178,0.12)', color: '#22d3ee', border: '1px solid rgba(8,145,178,0.2)' }}>{r.llc.tokenId}</span></td>
                          <td style={{ ...S.td, color: '#e2e8f0', fontWeight: 600 }}>{r.llc.inmueble}</td>
                          <td style={{ ...S.td, color: '#a78bfa', fontFamily: 'monospace', fontSize: '0.67rem' }}>{r.llc.ein}</td>
                          <td style={{ ...S.td, color: '#94a3b8' }}>{r.llc.constitucion}</td>
                          <td style={S.td}><span className="tag" style={{ background: r.llc.moneda === 'EUR' ? 'rgba(99,102,241,0.15)' : 'rgba(8,145,178,0.1)', color: r.llc.moneda === 'EUR' ? '#a78bfa' : '#22d3ee', border: `1px solid ${r.llc.moneda === 'EUR' ? 'rgba(99,102,241,0.3)' : 'rgba(8,145,178,0.2)'}` }}>{r.llc.moneda}</span></td>
                          <td style={S.td}><a href={`https://polygonscan.com/token/${r.tokenAddress}`} target="_blank" rel="noreferrer" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.68rem' }}>{short(r.tokenAddress)}</a></td>
                          <td style={{ ...S.td, color: '#34d399', fontWeight: 600 }}>{fmtNum(r.balance, 4)}</td>
                          <td style={{ ...S.td, fontWeight: 700, color: r.valorEur > 0 ? '#f59e0b' : '#1e293b' }}>{fmtEur(r.valorEur)}</td>
                          <td style={{ ...S.td, color: '#94a3b8' }}>{r.fechaPrimeraAdq || '—'}</td>
                          <td style={{ ...S.td, color: '#64748b', textAlign: 'center' }}>{r.numOperaciones}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <p style={{ color: '#1e293b', fontSize: '0.63rem', textAlign: 'center', marginTop: '0.4rem' }}>
              Valor nominal {VALOR_NOMINAL} USD/EUR · TC BCE 31/12/{ejercicio} · Polygon PoS · Modelo 720 AEAT · Reental.co
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
