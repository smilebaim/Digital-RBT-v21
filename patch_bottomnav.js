const fs = require('fs');
let code = fs.readFileSync('app/BottomNav.tsx', 'utf8');
code = code.replace(
  'export default function BottomNav() {',
  'function BottomNavInner() {'
);
code += `
import { Suspense as NavSuspense } from 'react';
export default function BottomNav() {
  return (
    <NavSuspense fallback={null}>
      <BottomNavInner />
    </NavSuspense>
  );
}
`;
fs.writeFileSync('app/BottomNav.tsx', code);
console.log('Patched BottomNav.tsx');
