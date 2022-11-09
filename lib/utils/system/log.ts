import pc from 'picocolors';

type NoticeType = 'info' | 'warn' | 'error' | 'success';

export const notice = (type: NoticeType, label: string): string => {
  const formattedLabel = `[${label.toLocaleLowerCase()}]`;

  switch (type) {
    case 'info': return pc.cyan(formattedLabel);
    case 'warn': return pc.yellow(formattedLabel);
    case 'success': return pc.green(formattedLabel);
    case 'error': return pc.red(formattedLabel);
    default: return pc.bgWhite(pc.black(formattedLabel));
  }
};

export const log = (notice: string, text: string, subNotice = ''): string => {
  return `${pc.gray(new Date().toLocaleTimeString())} ${(`${notice} ${subNotice}`).trim()} ${pc.gray(text)}`;
};
