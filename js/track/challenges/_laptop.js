// The laptop side of the story challenge 5 tells: one project, one run, one
// set of results sitting on a machine somewhere else. Shared by the two
// transfer challenges so their worlds are continuous — challenge 10 opens on
// exactly what challenge 9 left behind, plus the wreckage of a dropped copy.

export const INVERSION_CSV =
  "iteration,misfit,rms,stations\n1,0.482,1.191,412\n2,0.311,0.977,412\n3,0.204,0.802,412\n";

export const RUN13_CSV =
  "iteration,misfit,rms,stations\n1,0.517,1.284,404\n2,0.339,1.021,404\n3,0.226,0.846,404\n";

const NOTES =
  "# run 14\n\n- pull the results back off the cluster\n- plot misfit against iteration\n- ask Thandi whether run 13 used the same stations\n";

const PLOT =
  'import pandas as pd\nimport matplotlib.pyplot as plt\n\nm = pd.read_csv("results/misfit.csv")\nm.plot(x="iteration", y="misfit")\nplt.savefig("misfit.png")\n';

export const RUN12_LOG =
  "2026-07-29 19:02:11 slurmd[1187]: job=46884 step=prolog node=cn03 state=running\n2026-07-29 21:36:40 slurmd[1187]: job=46884 step=epilog node=cn03 state=completed exit=0\n";

export const RUN13_LOG =
  "2026-08-05 21:14:03 slurmd[1187]: job=47120 step=prolog node=cn01 state=running\n2026-08-05 22:41:57 slurmd[1187]: job=47120 step=epilog node=cn01 state=completed exit=0\n";

export const MODEL = { c: "(binary)\n", size: 90177536, binary: true };

export const LAPTOP = {
  inversion: {
    "notes.md": { c: NOTES },
    "plot.py": { c: PLOT },
    "run13.csv": { c: RUN13_CSV },
  },
  Downloads: {
    "hpc-account-form.pdf": { c: "(pdf)\n", size: 184320, binary: true },
  },
};
