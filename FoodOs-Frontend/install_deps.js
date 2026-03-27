const { execSync } = require('child_process');
try {
  console.log("Starting install...");
  const output = execSync('npm install three @react-three/fiber @react-three/drei --legacy-peer-deps', { encoding: 'utf-8', stdio: 'inherit' });
  console.log("Install complete.");
} catch (error) {
  console.error("Install failed: ", error.message);
}
