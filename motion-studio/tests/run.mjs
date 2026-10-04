// Tooling tests: the fixture renders end to end; each contract violation fails the render.
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

let failed = 0;
const run = (...a) => spawnSync('node', ['render.mjs', ...a], { encoding: 'utf8' });
const expect = (name, ok, detail = '') => { console.log(`${ok ? '✓' : '✗'} ${name}${ok ? '' : '\n' + detail}`); if (!ok) failed++; };

let r = run('tests/fixture', '--sheet');
expect('fixture: contact sheet', r.status === 0 && existsSync('tests/fixture/out/sheet-01.png') && existsSync('tests/fixture/beats.json'), r.stderr);
r = run('tests/fixture');
const mp4 = 'tests/fixture/out/fixture.mp4';
const probe = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=codec_name,pix_fmt', '-of', 'csv=p=0', mp4], { encoding: 'utf8' }).stdout.trim();
expect('fixture: H.264 yuv420p render at -14 LUFS', r.status === 0 && probe === 'h264,yuv420p' && /loudness: -1[345](\.\d+)? LUFS/.test(r.stderr), r.stderr + probe);

for (const [dir, why] of [['random', /Math\.random/], ['stateful', /carries state/], ['transition', /CSS transition/]]) {
  r = run(`tests/${dir}`, '--sheet');
  expect(`${dir}: rejected`, r.status !== 0 && why.test(r.stderr), r.stderr);
}
process.exit(failed ? 1 : 0);
