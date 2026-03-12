import { FileSystem } from './FileSystem'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OutputLine {
  id: number
  type: 'command' | 'output' | 'error' | 'info' | 'success'
  text: string
  prompt?: string   // only for 'command' lines
  html?: boolean    // render as HTML
}

let lineId = 0
function line(type: OutputLine['type'], text: string, opts?: Partial<OutputLine>): OutputLine {
  return { id: ++lineId, type, text, ...opts }
}

// ---------------------------------------------------------------------------
// Neofetch art
// ---------------------------------------------------------------------------

const ARCH_ART = [
  '                   -`',
  '                  .o+`',
  '                 `ooo/',
  '                `+oooo:',
  '               `+oooooo:',
  '               -+oooooo+:',
  '             `/:-:++oooo+:',
  '            `/++++/+++++++:',
  '           `/++++++++++++++:',
  '          `/+++ooooooooooooo/`',
  '         ./ooosssso++osssssso+`',
  '        .oossssso-````/ossssss+`',
  '       -osssssso.      :ssssssso.',
  '      :osssssss/        osssso+++.',
  '     /ossssssss/        +ssssooo/-',
  '   `/ossssso+/:-        -:/+osssso+-',
  '  `+sso+:-`                 `.-/+oso:',
  ' `++:.                           `-/+/',
  ' .`                                 `/',
]

// ---------------------------------------------------------------------------
// CommandExecutor
// ---------------------------------------------------------------------------

export class CommandExecutor {
  private fs: FileSystem
  private user = 'user'
  private hostname = 'vibe-machine'
  private history: string[] = []
  private env: Record<string, string> = {
    HOME: '/home/user',
    USER: 'user',
    SHELL: '/bin/bash',
    TERM: 'xterm-256color',
    LANG: 'en_US.UTF-8',
  }

  constructor(fs: FileSystem) {
    this.fs = fs
  }

  getPrompt(): string {
    return `${this.user}@${this.hostname}:${this.fs.cwdDisplay()}$`
  }

  getHistory(): string[] {
    return this.history
  }

  execute(input: string): OutputLine[] {
    const trimmed = input.trim()
    if (!trimmed) return []

    this.history.push(trimmed)

    const cmdLine = line('command', trimmed, { prompt: this.getPrompt() })
    const results = this.dispatch(trimmed)
    return [cmdLine, ...results]
  }

  private dispatch(input: string): OutputLine[] {
    // Handle pipes simply (show first command output only for now)
    const [cmd, ...rawArgs] = input.trim().split(/\s+/)
    const args = rawArgs.filter(Boolean)

    switch (cmd) {
      case 'help':      return this.cmdHelp()
      case 'ls':        return this.cmdLs(args)
      case 'll':        return this.cmdLs(['-la', ...args])
      case 'la':        return this.cmdLs(['-a', ...args])
      case 'cd':        return this.cmdCd(args[0])
      case 'pwd':       return this.cmdPwd()
      case 'cat':       return this.cmdCat(args)
      case 'echo':      return this.cmdEcho(args)
      case 'mkdir':     return this.cmdMkdir(args)
      case 'touch':     return this.cmdTouch(args)
      case 'rm':        return this.cmdRm(args)
      case 'clear':     return [line('info', '__CLEAR__')]
      case 'whoami':    return [line('output', this.user)]
      case 'hostname':  return [line('output', this.hostname)]
      case 'uname':     return this.cmdUname(args)
      case 'date':      return [line('output', new Date().toString())]
      case 'history':   return this.cmdHistory()
      case 'env':       return this.cmdEnv()
      case 'export':    return this.cmdExport(args)
      case 'neofetch':  return this.cmdNeofetch()
      case 'cmatrix':   return this.cmdCmatrix()
      case 'cowsay':    return this.cmdCowsay(args)
      case 'fortune':   return this.cmdFortune()
      case 'uptime':    return this.cmdUptime()
      case 'free':      return this.cmdFree()
      case 'df':        return this.cmdDf()
      case 'ps':        return this.cmdPs()
      case 'top':       return [line('info', 'top - interactive mode không được hỗ trợ trong terminal giả lập này.')]
      case 'vim':
      case 'nvim':      return [line('info', 'VIM - Vi IMproved 9.0\n:q để thoát (lịch sử nhân loại)\n\nJust kidding — editor mode không được hỗ trợ ở đây. 😅')]
      case 'nano':      return [line('info', 'nano: editor mode không được hỗ trợ ở đây.')]
      case 'sudo':      return this.cmdSudo(args)
      case 'pacman':    return this.cmdPacman(args)
      case 'apt':
      case 'apt-get':   return [line('error', `E: Lệnh 'apt' không tìm thấy. Bạn đang dùng Arch Linux btw. Hãy dùng 'pacman'.`)]
      case 'brew':      return [line('error', `brew: command not found. Đây là Linux, không phải macOS.`)]
      case 'ping':      return this.cmdPing(args)
      case 'curl':      return this.cmdCurl(args)
      case 'wget':      return [line('info', `--2026-03-09 14:18:23--  ${args[0] ?? 'https://...'}\nResolving... done.\nConnecting... done.\nHTTP request sent, awaiting response... 200 OK\nLength: 42 [text/plain]\nSaving to: '${args[0]?.split('/').pop() ?? 'index.html'}'`)]
      case 'git':       return this.cmdGit(args)
      case 'node':      return [line('info', 'Node.js v22.0.0\nWelcome to Node.js REPL (giả lập — chỉ in thông báo này)')]
      case 'python':
      case 'python3':   return [line('info', 'Python 3.12.0\n>>> (giả lập — chỉ in thông báo này)')]
      case 'ssh':       return [line('output', `ssh: connect to host ${args[0] ?? 'remote'}: Connection timed out`)]
      case 'man':       return this.cmdMan(args[0])
      case 'which':     return this.cmdWhich(args[0])
      case 'find':      return this.cmdFind(args)
      case 'grep':      return this.cmdGrep(args)
      case 'wc':        return this.cmdWc(args)
      case 'head':      return this.cmdHead(args)
      case 'tail':      return this.cmdTail(args)
      case 'chmod':     return [line('output', '')]
      case 'chown':     return [line('error', `chown: changing ownership of '${args[1] ?? ''}': Operation not permitted`)]
      case 'alias':     return this.cmdAlias(args)
      case 'exit':      return [line('info', 'Thoát terminal... (F5 để refresh trang)')]
      case 'logout':    return [line('info', 'logout')]
      case 'reboot':    return [line('info', 'Broadcast message from user@vibe-machine:\nThe system is going down for reboot NOW!\n\n(Không thể reboot thật đâu, yên tâm 😄)')]
      case 'shutdown':  return [line('info', 'Shutdown scheduled... just kidding. 😄')]
      case 'htop':      return [line('info', 'htop - interactive mode không được hỗ trợ.\nDùng "ps aux" để xem processes.')]
      case 'tree':      return this.cmdTree()
      case 'sl':        return [line('output', '      ====        ________                ___________\n  _D _|  |_______/        \\__I_I_____===__|_______|\n   |(_)---  |   H\\________/ |   |        =|___ ___|   _________\n   /     |  |   H  |  |     | __|       _|___|___|   _|        |\n  |      |  |   H  |  |     |==|      _|IIIII_____  =|________ |\n  |      |  |   H  |____I___| ==|   _| IIIII /    \\   |       |\n \\___   /   |___|  / ====   \\  | |_IIIIII|   /  D  \\  =| ____ |\n  |___|/           \\_IIIIIII_\\ |_________|  /========\\ =| ____|_\n                               \\___________\\   ||  |  | =|____|__\\=====\n                                            \\  ||  /  |  _|_|___|\n                                             \\_||_/   `------\'  ')]
      default:          return [line('error', `bash: ${cmd}: command not found\nGõ 'help' để xem danh sách lệnh hỗ trợ.`)]
    }
  }

  // ---- Commands implementation -------------------------------------------

  private cmdHelp(): OutputLine[] {
    return [line('output', `Hệ thống Linux Terminal giả lập - Các lệnh hỗ trợ:

  Điều hướng & File:
    ls [-la]    Liệt kê file/thư mục
    cd <path>   Chuyển thư mục (hỗ trợ ~, .., đường dẫn tuyệt đối)
    pwd         In thư mục hiện tại
    cat <file>  Xem nội dung file
    mkdir <dir> Tạo thư mục mới
    touch <f>   Tạo file trống
    rm [-r] <f> Xóa file/thư mục
    tree        Hiển thị cấu trúc thư mục dạng cây
    find        Tìm kiếm file

  Thông tin hệ thống:
    neofetch    Thông tin hệ thống + ASCII art
    uname -a    Thông tin kernel
    uptime      Thời gian hoạt động
    free -h     Bộ nhớ RAM
    df -h       Dung lượng ổ đĩa
    ps aux      Danh sách processes
    whoami      Tên user hiện tại
    date        Ngày giờ hệ thống
    env         Biến môi trường

  Fun:
    cowsay <msg>  Con bò nói chuyện
    fortune       Câu cách ngôn ngẫu nhiên
    cmatrix       Matrix effect (text)
    sl            Steam locomotive
    ping <host>   Ping host

  Khác:
    echo <text>   In ra màn hình
    history       Lịch sử lệnh
    man <cmd>     Hướng dẫn lệnh
    which <cmd>   Đường dẫn lệnh
    grep          Tìm kiếm trong text
    git           Git commands giả lập
    pacman        Package manager Arch
    clear         Xóa màn hình
    help          Hiển thị trang này

  Phím tắt:
    ↑ / ↓        Lịch sử lệnh
    Tab          Autocomplete
    Ctrl+C       Hủy lệnh
    Ctrl+L       Xóa màn hình`)]
  }

  private cmdLs(args: string[]): OutputLine[] {
    const showAll = args.includes('-a') || args.includes('-la') || args.includes('-al')
    const longFmt = args.includes('-l') || args.includes('-la') || args.includes('-al')
    const pathArg = args.find(a => !a.startsWith('-'))
    const result = this.fs.ls(pathArg)
    if (!result.ok) return [line('error', result.error)]

    let nodes = result.nodes
    if (!showAll) nodes = nodes.filter(n => !n.name.startsWith('.'))

    if (nodes.length === 0) return []

    if (longFmt) {
      const total = `total ${nodes.length * 4}`
      const lines = nodes.map(n => {
        const sizeStr = n.type === 'dir' ? '4096' : String(n.size ?? n.content?.length ?? 0).padStart(8)
        return `${n.permissions ?? (n.type === 'dir' ? 'drwxr-xr-x' : '-rw-r--r--')}  1 ${n.owner ?? 'user'} ${n.owner ?? 'user'} ${sizeStr} ${n.modified ?? 'Jan  1 00:00'} ${n.name}${n.type === 'dir' ? '/' : ''}`
      })
      return [line('output', [total, ...lines].join('\n'))]
    }

    // Short format — colorize dirs
    const items = nodes.map(n => n.type === 'dir' ? `\x1b[dir]${n.name}/` : n.name)
    return [line('output', items.join('  '), { html: false })]
  }

  private cmdCd(path?: string): OutputLine[] {
    const err = this.fs.cd(path ?? '~')
    if (err) return [line('error', err)]
    return []
  }

  private cmdPwd(): OutputLine[] {
    return [line('output', this.fs.pwd())]
  }

  private cmdCat(args: string[]): OutputLine[] {
    if (!args.length) return [line('error', 'cat: missing operand')]
    return args.flatMap(f => {
      const result = this.fs.cat(f)
      if (!result.ok) return [line('error', result.error)]
      return [line('output', result.content)]
    })
  }

  private cmdEcho(args: string[]): OutputLine[] {
    return [line('output', args.join(' '))]
  }

  private cmdMkdir(args: string[]): OutputLine[] {
    if (!args.length) return [line('error', 'mkdir: missing operand')]
    return args.flatMap(name => {
      const err = this.fs.mkdir(name)
      return err ? [line('error', err)] : []
    })
  }

  private cmdTouch(args: string[]): OutputLine[] {
    if (!args.length) return [line('error', 'touch: missing operand')]
    return args.flatMap(name => {
      const err = this.fs.touch(name)
      return err ? [line('error', err)] : []
    })
  }

  private cmdRm(args: string[]): OutputLine[] {
    const recursive = args.includes('-r') || args.includes('-rf') || args.includes('-R')
    const files = args.filter(a => !a.startsWith('-'))
    if (!files.length) return [line('error', 'rm: missing operand')]
    // Protect root and critical dirs
    if (files.some(f => f === '/' || f === '~')) {
      return [line('error', `rm: it is dangerous to operate recursively on '/'`)]
    }
    return files.flatMap(name => {
      const err = this.fs.rm(name, recursive)
      return err ? [line('error', err)] : []
    })
  }

  private cmdUname(args: string[]): OutputLine[] {
    if (args.includes('-a')) {
      return [line('output', 'Linux vibe-machine 6.7.0-arch1-1 #1 SMP PREEMPT_DYNAMIC Fri, 09 Mar 2026 07:00:00 +0000 x86_64 GNU/Linux')]
    }
    return [line('output', 'Linux')]
  }

  private cmdHistory(): OutputLine[] {
    if (!this.history.length) return []
    const lines = this.history.map((cmd, i) => `  ${String(i + 1).padStart(3)}  ${cmd}`).join('\n')
    return [line('output', lines)]
  }

  private cmdEnv(): OutputLine[] {
    const lines = Object.entries(this.env).map(([k, v]) => `${k}=${v}`).join('\n')
    return [line('output', lines)]
  }

  private cmdExport(args: string[]): OutputLine[] {
    for (const a of args) {
      const [k, v] = a.split('=')
      if (k && v !== undefined) this.env[k] = v
    }
    return []
  }

  private cmdNeofetch(): OutputLine[] {
    const upMins = Math.floor(Math.random() * 120 + 10)
    const info = [
      `\x1b[bold]\x1b[cyan]user\x1b[reset]@\x1b[bold]\x1b[cyan]vibe-machine\x1b[reset]`,
      `─────────────────────────`,
      `OS:       Arch Linux x86_64`,
      `Kernel:   6.7.0-arch1-1`,
      `Uptime:   ${upMins} mins`,
      `Shell:    bash 5.2.21`,
      `DE:       Hyprland`,
      `Terminal: vibe-term`,
      `CPU:      AMD Ryzen 9 7950X (32) @ 5.7GHz`,
      `GPU:      AMD Radeon RX 7900 XTX`,
      `Memory:   ${Math.floor(Math.random() * 4096 + 2048)} MiB / 32768 MiB`,
      ``,
      `● ● ● ● ● ● ● ● (terminal colors)`,
    ]
    const maxLen = Math.max(ARCH_ART.length, info.length)
    const result = []
    for (let i = 0; i < maxLen; i++) {
      const art = (ARCH_ART[i] ?? '').padEnd(22)
      const inf = info[i] ?? ''
      result.push(`${art}  ${inf}`)
    }
    return [line('output', result.join('\n'))]
  }

  private cmdCmatrix(): OutputLine[] {
    const chars = '01ABCDEF$@#%!?'
    const rows = 8
    const cols = 60
    const frame = Array.from({ length: rows }, () =>
      Array.from({ length: cols }, () => (Math.random() > 0.7 ? chars[Math.floor(Math.random() * chars.length)] : ' ')).join('')
    ).join('\n')
    return [line('output', frame + '\n\n[Ctrl+C to exit cmatrix]')]
  }

  private cmdCowsay(args: string[]): OutputLine[] {
    const msg = args.join(' ') || 'Moo!'
    const len = msg.length
    const border = '-'.repeat(len + 2)
    return [line('output',
      ` ${border}\n< ${msg} >\n ${border}\n        \\   ^__^\n         \\  (oo)\\_______\n            (__)\\       )\\/\\\n                ||----w |\n                ||     ||`
    )]
  }

  private cmdFortune(): OutputLine[] {
    const fortunes = [
      'Btw, I use Arch.',
      'There is no place like 127.0.0.1.',
      '640K ought to be enough for anybody. – Bill Gates, 1981',
      'It works on my machine. — Every developer, ever.',
      'rm -rf / — The most powerful command known to mankind.',
      'To understand recursion, you must first understand recursion.',
      'A computer never does what you want, only what you tell it.',
      'The best code is no code at all.',
      'RTFM — Read The Friendly Manual.',
      'In code we trust... except when we debug.',
    ]
    return [line('output', fortunes[Math.floor(Math.random() * fortunes.length)] ?? '')]
  }

  private cmdUptime(): OutputLine[] {
    const upMins = Math.floor(Math.random() * 500 + 10)
    const h = Math.floor(upMins / 60)
    const m = upMins % 60
    return [line('output', ` ${new Date().toLocaleTimeString()} up ${h}:${String(m).padStart(2, '0')}, 1 user,  load average: 0.${Math.floor(Math.random() * 99)}, 0.${Math.floor(Math.random() * 99)}, 0.${Math.floor(Math.random() * 99)}`)]
  }

  private cmdFree(): OutputLine[] {
    return [line('output',
      `              total        used        free      shared  buff/cache   available\nMem:          32768        8421       16292         512        4055       23834\nSwap:          8192           0        8192`
    )]
  }

  private cmdDf(): OutputLine[] {
    return [line('output',
      `Filesystem      Size  Used Avail Use% Mounted on\ndev             16G     0   16G   0% /dev\ntmpfs           16G  1.2M   16G   1% /run\n/dev/nvme0n1p2 468G  142G  303G  32% /\ntmpfs           16G  512M   16G   3% /dev/shm\n/dev/nvme0n1p1  511M   10M  502M   2% /boot`
    )]
  }

  private cmdPs(): OutputLine[] {
    return [line('output',
      `USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND\nroot           1  0.0  0.0 168712  9812 ?        Ss   14:00   0:01 /sbin/init\nroot         420  0.0  0.0  19760  6144 ?        Ss   14:00   0:00 /usr/lib/systemd\nuser        1337  0.1  0.5 812640 87920 ?        Sl   14:00   0:12 chromium\nuser        1338  0.0  0.0  11720  3840 pts/0    Ss   14:18   0:00 bash\nuser        1339  0.0  0.0  11184  1664 pts/0    R+   14:18   0:00 ps aux`
    )]
  }

  private cmdSudo(args: string[]): OutputLine[] {
    if (args[0] === 'pacman' || args[0] === 'rm') {
      return this.dispatch(args.join(' '))
    }
    if (args[0] === 'su') return [line('output', '[sudo] password for user: \nWelcome, root! (giả lập)')]
    return [line('error', `[sudo] password for ${this.user}: \nsudo: ${args[0] ?? 'command'}: command not found`)]
  }

  private cmdPacman(args: string[]): OutputLine[] {
    if (args[0] === '-Syu' || args[0] === '-Syyu') {
      return [line('output',
        `:: Synchronizing package databases...\n core                     1.1 MiB  12.3 MiB/s\n extra                    8.4 MiB   9.8 MiB/s\n :: Starting full system upgrade...\n resolving dependencies...\n looking for conflicting packages...\n\n Packages (3) linux-6.7.4-1  pacman-6.0.2-7  neovim-0.9.5-1\n\n Total Installed Size: 142.00 MiB\n Net Upgrade Size:       1.32 MiB\n\n:: Proceed with installation? [Y/n] Y\n(3/3) upgrading linux         [################] 100%\n:: Running post-transaction hooks...\n==> Updating module dependencies...\nSystem upgraded successfully! 🎉`
      )]
    }
    if (args[0] === '-S') {
      const pkg = args[1] ?? '<pkg>'
      return [line('output', `resolving dependencies...\nlooking for conflicting packages...\n\n  ${pkg} package is now installed (giả lập).`)]
    }
    if (args[0] === '-Ss') {
      return [line('output', `core/${args[1] ?? 'bash'} 5.2.21-1\n    GNU Bourne-Again shell\nextra/neovim 0.9.5-1\n    Fork of Vim aiming to improve user experience`)]
    }
    return [line('output', `pacman: unrecognized option '${args[0] ?? ''}'\nUsage: pacman <operation> [options] [targets]\nOperations: -S (sync) -Q (query) -R (remove) -Syu (upgrade)`)]
  }

  private cmdPing(args: string[]): OutputLine[] {
    const host = args.find(a => !a.startsWith('-')) ?? 'localhost'
    const lines = [`PING ${host}: 56 data bytes`]
    for (let i = 0; i < 4; i++) {
      const ms = (Math.random() * 50 + 1).toFixed(3)
      lines.push(`64 bytes from ${host}: icmp_seq=${i} ttl=64 time=${ms} ms`)
    }
    lines.push(`\n--- ${host} ping statistics ---\n4 packets transmitted, 4 received, 0% packet loss`)
    return [line('output', lines.join('\n'))]
  }

  private cmdCurl(args: string[]): OutputLine[] {
    const url = args.find(a => !a.startsWith('-')) ?? ''
    if (url.includes('wttr.in')) {
      return [line('output', `Weather report: Hanoi, Vietnam\n\n  ☀️  Sunny\n     🌡️  29°C\n     💨  NE 15 km/h\n     🌊  58%`)]
    }
    return [line('output', `<!DOCTYPE html>\n<html><head><title>${url}</title></head>\n<body><p>Simulated response from ${url}</p></body></html>`)]
  }

  private cmdGit(args: string[]): OutputLine[] {
    switch (args[0]) {
      case 'status':  return [line('output', 'On branch main\nYour branch is up to date with \'origin/main\'.\n\nnothing to commit, working tree clean')]
      case 'log':     return [line('output', 'commit a1b2c3d4e5f6 (HEAD -> main, origin/main)\nAuthor: TechSpherex AI <ai@vibe.j2team.org>\nDate:   Sun Mar 9 14:18:23 2026\n\n    feat: add linux terminal simulator\n\ncommit 9f8e7d6c5b4a\nAuthor: user <user@vibe-machine>\nDate:   Sat Mar 8 20:00:00 2026\n\n    initial commit')]
      case 'branch': return [line('output', '* main\n  develop\n  feature/linux-terminal')]
      case 'diff':   return [line('output', 'diff --git a/src/index.ts b/src/index.ts\n--- a/src/index.ts\n+++ b/src/index.ts\n@@ -1,3 +1,4 @@\n+// Added new feature\n import { app } from \'./app\'')]
      case 'clone':  return [line('output', `Cloning into '${args[1]?.split('/').pop()?.replace('.git', '') ?? 'repo'}'...\nremote: Counting objects: 42, done.\nReceiving objects: 100% (42/42), 1.23 MiB | 5.00 MiB/s, done.`)]
      case 'pull':   return [line('output', 'Already up to date.')]
      case 'push':   return [line('output', 'Everything up-to-date')]
      case 'add':    return [line('output', '')]
      case 'commit': return [line('output', `[main a1b2c3d] ${args.slice(2).join(' ')}\n 1 file changed, 1 insertion(+)`)]
      case 'init':   return [line('output', `Initialized empty Git repository in ${this.fs.pwd()}/.git/`)]
      default:       return [line('output', 'usage: git [-v | --version] [-h | --help] <command> [<args>]')]
    }
  }

  private cmdMan(cmd?: string): OutputLine[] {
    if (!cmd) return [line('error', 'What manual page do you want?')]
    const manuals: Record<string, string> = {
      ls: 'LS(1)\nNAME\n    ls - list directory contents\nSYNOPSIS\n    ls [OPTION]... [FILE]...\nDESCRIPTION\n    List information about the FILEs.\n    -a    do not ignore entries starting with .\n    -l    use a long listing format',
      cd: 'CD(1)\nNAME\n    cd - change the shell working directory\nSYNOPSIS\n    cd [dir]\nDESCRIPTION\n    Change the current directory to dir.',
      cat: 'CAT(1)\nNAME\n    cat - concatenate files and print on the standard output\nSYNOPSIS\n    cat [OPTION]... [FILE]...',
    }
    return [line('output', manuals[cmd] ?? `No manual entry for ${cmd}`)]
  }

  private cmdWhich(cmd?: string): OutputLine[] {
    if (!cmd) return [line('error', 'which: missing argument')]
    const bins: Record<string, string> = {
      bash: '/usr/bin/bash',
      ls: '/usr/bin/ls',
      cat: '/usr/bin/cat',
      git: '/usr/bin/git',
      node: '/usr/local/bin/node',
      python3: '/usr/bin/python3',
      pacman: '/usr/bin/pacman',
      nvim: '/usr/bin/nvim',
    }
    return bins[cmd]
      ? [line('output', bins[cmd])]
      : [line('error', `which: no ${cmd} in (/usr/local/bin:/usr/bin:/bin)`)]
  }

  private cmdFind(_args: string[]): OutputLine[] {
    return [line('output', `./documents\n./documents/readme.txt\n./downloads\n./downloads/linux-6.7.tar.gz`)]
  }

  private cmdGrep(args: string[]): OutputLine[] {
    const pattern = args[0] ?? ''
    const file = args[1]
    if (file) {
      const result = this.fs.cat(file)
      if (!result.ok) return [line('error', result.error)]
      const matches = result.content.split('\n').filter(l => l.includes(pattern))
      return matches.length
        ? [line('output', matches.join('\n'))]
        : []
    }
    return [line('error', 'grep: missing operand')]
  }

  private cmdWc(args: string[]): OutputLine[] {
    const file = args.find(a => !a.startsWith('-'))
    if (!file) return [line('error', 'wc: missing operand')]
    const result = this.fs.cat(file)
    if (!result.ok) return [line('error', result.error)]
    const lines = result.content.split('\n').length
    const words = result.content.split(/\s+/).filter(Boolean).length
    const bytes = result.content.length
    return [line('output', `  ${lines}  ${words} ${bytes} ${file}`)]
  }

  private cmdHead(args: string[]): OutputLine[] {
    const nIdx = args.findIndex(a => a === '-n')
    const n = nIdx !== -1 ? parseInt(args[nIdx + 1] ?? '10') : 10
    const file = args.find(a => !a.startsWith('-') && !/^\d+$/.test(a))
    if (!file) return [line('error', 'head: missing operand')]
    const result = this.fs.cat(file)
    if (!result.ok) return [line('error', result.error)]
    return [line('output', result.content.split('\n').slice(0, n).join('\n'))]
  }

  private cmdTail(args: string[]): OutputLine[] {
    const nIdx = args.findIndex(a => a === '-n')
    const n = nIdx !== -1 ? parseInt(args[nIdx + 1] ?? '10') : 10
    const file = args.find(a => !a.startsWith('-') && !/^\d+$/.test(a))
    if (!file) return [line('error', 'tail: missing operand')]
    const result = this.fs.cat(file)
    if (!result.ok) return [line('error', result.error)]
    const all = result.content.split('\n')
    return [line('output', all.slice(-n).join('\n'))]
  }

  private cmdAlias(args: string[]): OutputLine[] {
    if (!args.length) {
      return [line('output', "alias ll='ls -la'\nalias la='ls -a'\nalias gs='git status'\nalias vim='nvim'")]
    }
    return []
  }

  private cmdTree(): OutputLine[] {
    function walk(node: import('./FileSystem').VNode, prefix = '', isLast = true): string[] {
      const connector = isLast ? '└── ' : '├── '
      const childPrefix = isLast ? '    ' : '│   '
      const lines: string[] = [prefix + connector + node.name + (node.type === 'dir' ? '/' : '')]
      if (node.type === 'dir' && node.children) {
        node.children.forEach((child, idx) => {
          lines.push(...walk(child, prefix + childPrefix, idx === node.children!.length - 1))
        })
      }
      return lines
    }

    const result = this.fs.ls()
    if (!result.ok) return [line('error', result.error)]
    const lines = ['.']
    result.nodes.forEach((node, idx) => {
      lines.push(...walk(node, '', idx === result.nodes.length - 1))
    })
    return [line('output', lines.join('\n'))]
  }

  autocomplete(partial: string): string[] {
    const parts = partial.split(' ')
    if (parts.length === 1) {
      const cmds = ['ls', 'll', 'cd', 'pwd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'clear', 'whoami', 'neofetch', 'cowsay', 'fortune', 'uptime', 'free', 'df', 'ps', 'git', 'pacman', 'history', 'help', 'man', 'which', 'grep', 'find', 'tree', 'ping', 'uname', 'date', 'export', 'env', 'cmatrix', 'sl', 'exit']
      return cmds.filter(c => c.startsWith(parts[0] ?? ''))
    }
    return this.fs.autocomplete(parts[parts.length - 1] ?? '')
  }
}
