import { PW } from "./gen-data.js";

const ARCHIVES = ["hpl-2.3", "openblas-0.3.26", "openmpi-4.1.6", "hpcg-3.1",
  "stream-5.10", "hpcc-1.5.0", "lammps-stable", "gromacs-2024",
  "fftw-3.3.10", "netcdf-4.9.2", "hdf5-1.14", "scalapack-2.2"];

export default {
  n: 11,
  title: "tarballs all the way down",
  commands: ["tar", "file", "ls", "cat", "find"],
  reading: [
    { label: "tar(1) — the -xzf you will type forever", url: "https://man7.org/linux/man-pages/man1/tar.1.html" },
    { label: "Docs: building HPC software from source", url: "#/docs/hpl" },
  ],
  variants: PW[11].map((pass, i) => ({ pass, name: ARCHIVES[i] })),
  build(v) {
    return {
      goal: `<p>HPC software mostly arrives as <strong>source tarballs</strong> — on the
        real cluster you will download and unpack HPL, OpenBLAS and OpenMPI exactly like
        this before building them.</p>
        <p>Your home directory contains <code>${v.name}.tar.gz</code>. Confirm what it is
        with <code>file</code>, extract it with <code>tar -xzf ${v.name}.tar.gz</code>
        (e<strong>x</strong>tract, g<strong>z</strong>ip, <strong>f</strong>ile — add
        <code>v</code> to watch it happen), then explore what came out. The password is
        inside.</p>`,
      fs: {
        "/home/student": {
          [`${v.name}.tar.gz`]: {
            c: "\x1f\x8b(gzip data)", binary: true, size: 48213,
            archive: {
              [v.name]: {
                "README": { c: `${v.name}\n=========\n\nTo build, see INSTALL. This copy was staged for the UWC cluster.\nMaintainer note - password for the next level: ${v.pass}\n` },
                "INSTALL": { c: "1. edit Make.<arch>\n2. make arch=<arch>\n3. profit\n" },
                "Makefile": { c: "# stub Makefile - the real build happens on the cluster\n" },
              },
            },
          },
        },
      },
    };
  },
};
