import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const tag = `v${pkg.version}`;

function run(command) {
  return execSync(command, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
}

try {
  run(`git rev-parse ${tag}`);
  console.log(`标签 ${tag} 已存在，跳过创建。`);
} catch {
  run(`git tag -a ${tag} -m "Release ${tag}"`);
  console.log(`已创建标签 ${tag}`);
}

console.log(`
版本号: ${pkg.version}
回退到该版本:
  git checkout ${tag}

从该版本新建分支继续开发:
  git checkout -b hotfix/${tag} ${tag}

查看所有版本标签:
  git tag -l "v*"
`);
