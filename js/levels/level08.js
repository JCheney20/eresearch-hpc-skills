import { PW } from "./gen-data.js";

export default {
  n: 8,
  title: "base64",
  commands: ["base64", "cat", "file"],
  reading: [{ label: "base64(1) — encode/decode base64", url: "https://man7.org/linux/man-pages/man1/base64.1.html" }],
  variants: PW[8].map((pass, i) => ({ pass, i })),
  build(v) {
    const encoded = btoa(`The password is ${v.pass}`);
    return {
      goal: `<p><code>data.txt</code> holds the password — but it has been
        <strong>base64-encoded</strong>. Base64 is not encryption: it is a reversible way
        of writing arbitrary bytes using only safe ASCII characters (you will meet it in
        SSH keys, munge credentials, Kubernetes secrets…).</p>
        <p>You can recognise it by the character set (<code>A–Z a–z 0–9 + /</code>,
        often ending in <code>=</code>). Decode it with <code>base64 -d data.txt</code>.</p>`,
      fs: {
        "/home/student": { "data.txt": { c: encoded + "\n" } },
      },
    };
  },
};
