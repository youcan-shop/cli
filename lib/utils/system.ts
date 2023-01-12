export const kill = (pid: number, signal = 'SIGTERM', timeout = 1000): Promise<void> =>
  new Promise((resolve, reject) => {
    process.kill(pid, signal);

    let count = 0;

    setInterval(() => {
      try {
        process.kill(pid, 0);
      }
      catch (e) {
        resolve();
      }

      count += 100;
      if (count > timeout)
        reject(new Error('Timeout process kill'));
    }, 100);
  });
