#!/usr/bin/env node
/* حساب بصمة FNV-1a لكلمة مرور بوابة الفهرس.

   الاستخدام:
       node landing/scripts/password-hash.mjs "كلمة-المرور-الجديدة"

   ثم استبدل قيمة PASSWORD_HASH في landing/template.html بالقيمة المطبوعة.
   تذكير: البوابة حاجز تجميلي فقط، والبصمة تُنشر مع الصفحة ويمكن تجاوزها تقنيًا. */

const password = (process.argv[2] || "").trim();

if (!password) {
  console.error('usage: node landing/scripts/password-hash.mjs "new-password"');
  process.exit(1);
}

function hash(text) {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

const value = hash(password);
console.log(`PASSWORD_HASH = 0x${value.toString(16)}  (${value})`);
