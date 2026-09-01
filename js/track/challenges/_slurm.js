// The scheduler's answers. Shared by the four "running work" challenges so the
// queue a learner reads in challenge 15 is the queue their own job joins in
// challenge 16 and watches drain in challenge 17.

export const SINFO = [
  "PARTITION AVAIL  TIMELIMIT  NODES  STATE NODELIST",
  "compute*     up 3-00:00:00      6  down* cn13,cn20,cn31,cn38,cn44,cn47",
  "compute*     up 3-00:00:00     29  alloc cn01-cn12,cn14-cn19,cn21-cn26,cn28-cn30,cn32",
  "compute*     up 3-00:00:00     13   idle cn33-cn37,cn39-cn43,cn45-cn46",
  "bigmem       up 1-00:00:00      2  alloc cn49-cn50",
  "gpu          up 1-00:00:00      1   idle cn51",
].join("\n");

export const SQUEUE = [
  "             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)",
  "             49118   compute  meshgen   sipho  R    2:14:07      8 cn01-cn08",
  "             49120   compute      hpl  thandi  R    1:48:31     12 cn09-cn12,cn14-cn19,cn21-cn22",
  "             49131   bigmem   assemble    nadia  R      41:02      2 cn49-cn50",
  "             49134   compute  inverse   sipho  R      22:55      6 cn23-cn26,cn28-cn29",
  "             49137   compute   segyqc  thandi  R      11:40      1 cn30",
  "             49141   compute  meshgen   nadia PD       0:00     16 (Resources)",
  "             49142   compute      hpl   sipho PD       0:00     24 (Priority)",
].join("\n");

export const SQUEUE_ME = [
  "             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)",
  "             49150   compute inversio student PD       0:00      4 (Priority)",
].join("\n");

export const SQUEUE_ME_RUNNING = [
  "             JOBID PARTITION     NAME     USER ST       TIME  NODES NODELIST(REASON)",
  "             49150   compute inversio student  R       0:37      4 cn33-cn36",
].join("\n");
