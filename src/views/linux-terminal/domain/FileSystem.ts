// ---------------------------------------------------------------------------
// Virtual File System
// ---------------------------------------------------------------------------

export type FileType = 'file' | 'dir'

export interface VNode {
  name: string
  type: FileType
  content?: string      // only for 'file'
  children?: VNode[]    // only for 'dir'
  permissions?: string
  owner?: string
  size?: number
  modified?: string
}

// Build the initial virtual FS tree
function makeDir(name: string, children: VNode[], opts?: Partial<VNode>): VNode {
  return { name, type: 'dir', children, permissions: 'drwxr-xr-x', owner: 'root', modified: 'Mar  9 14:00', ...opts }
}

function makeFile(name: string, content: string, opts?: Partial<VNode>): VNode {
  return {
    name,
    type: 'file',
    content,
    permissions: '-rw-r--r--',
    owner: 'user',
    size: content.length,
    modified: 'Mar  9 14:00',
    ...opts,
  }
}

export const ROOT: VNode = makeDir('/', [
  makeDir('home', [
    makeDir('user', [
      makeDir('documents', [
        makeFile('readme.txt', 'Chào mừng đến với Linux Terminal giả lập!\n\nĐây là môi trường terminal ảo để bạn thử các lệnh Linux cơ bản.\nGõ "help" để xem danh sách lệnh hỗ trợ.'),
        makeFile('notes.md', '# Ghi chú\n\n- Học Linux mỗi ngày\n- Thực hành nhiều hơn lý thuyết\n- RTFM (Read The Friendly Manual)'),
        makeDir('projects', [
          makeFile('todo.txt', '[ ] Học Bash scripting\n[x] Cài đặt Arch Linux\n[ ] Viết script backup'),
        ]),
      ]),
      makeDir('downloads', [
        makeFile('linux-6.7.tar.gz', '[binary data]', { permissions: '-rw-r--r--', size: 142857600 }),
        makeFile('arch-install.sh', '#!/bin/bash\n# Arch Linux installer script\necho "Btw, I use Arch"', { permissions: '-rwxr-xr-x', owner: 'user' }),
      ]),
      makeDir('.config', [
        makeDir('nvim', [
          makeFile('init.lua', '-- Neovim config\nvim.opt.number = true\nvim.opt.relativenumber = true'),
        ]),
      ]),
      makeFile('.bashrc', '# ~/.bashrc\nexport PATH="$HOME/.local/bin:$PATH"\nalias ll="ls -la"\nalias gs="git status"\nalias vim="nvim"', { permissions: '-rw-r--r--' }),
      makeFile('.bash_history', 'ls -la\ncd documents\ncat readme.txt\nneofetch\nsudo pacman -Syu'),
    ], { owner: 'user' }),
  ]),
  makeDir('etc', [
    makeFile('hostname', 'vibe-machine'),
    makeFile('os-release', 'NAME="Arch Linux"\nVERSION_ID="rolling"\nID=arch\nPRETTY_NAME="Arch Linux"'),
    makeFile('passwd', 'root:x:0:0:root:/root:/bin/bash\nuser:x:1000:1000::/home/user:/bin/bash'),
  ]),
  makeDir('usr', [
    makeDir('bin', [], { permissions: 'drwxr-xr-x' }),
    makeDir('local', [
      makeDir('bin', [], { permissions: 'drwxr-xr-x' }),
    ]),
  ]),
  makeDir('var', [
    makeDir('log', [
      makeFile('syslog', '[kernel] Started Linux\n[systemd] All services started\n[network] Connected to internet'),
    ]),
  ]),
  makeDir('tmp', [], { permissions: 'drwxrwxrwt', owner: 'root' }),
], { permissions: 'drwxr-xr-x', owner: 'root' })

// ---------------------------------------------------------------------------
// FileSystem class — stateful navigation & resolution
// ---------------------------------------------------------------------------

export class FileSystem {
  private root: VNode
  private cwd: string[]  // path segments from root

  constructor() {
    this.root = ROOT
    this.cwd = ['home', 'user']  // start at ~/
  }

  // ---- Path helpers -------------------------------------------------------

  cwdPath(): string {
    if (this.cwd.length === 0) return '/'
    return '/' + this.cwd.join('/')
  }

  cwdDisplay(): string {
    // Show ~ for home dir
    const full = this.cwdPath()
    if (full === '/home/user' || full.startsWith('/home/user/')) {
      return '~' + full.slice('/home/user'.length)
    }
    return full
  }

  private resolve(path: string): VNode | null {
    const parts = this.parsePath(path)
    let node: VNode = this.root
    for (const part of parts) {
      if (node.type !== 'dir' || !node.children) return null
      const child = node.children.find(c => c.name === part)
      if (!child) return null
      node = child
    }
    return node
  }

  private parsePath(path: string): string[] {
    if (path.startsWith('/')) {
      // absolute
      return path.split('/').filter(Boolean)
    }
    if (path.startsWith('~')) {
      return ['home', 'user', ...path.slice(1).split('/').filter(Boolean)]
    }
    // relative — resolve against cwd
    const segments = [...this.cwd]
    for (const part of path.split('/').filter(Boolean)) {
      if (part === '..') {
        if (segments.length > 0) segments.pop()
      } else if (part !== '.') {
        segments.push(part)
      }
    }
    return segments
  }

  // ---- Public API ---------------------------------------------------------

  ls(path?: string): { ok: true; nodes: VNode[] } | { ok: false; error: string } {
    const target = path ? this.resolve(path) : this.resolve(this.cwdPath())
    if (!target) return { ok: false, error: `ls: cannot access '${path}': No such file or directory` }
    if (target.type === 'file') return { ok: true, nodes: [target] }
    return { ok: true, nodes: target.children ?? [] }
  }

  cd(path: string): string | null {
    if (!path || path === '~') {
      this.cwd = ['home', 'user']
      return null
    }
    const parts = this.parsePath(path)
    const target = this.resolve(parts.length === 0 ? '/' : '/' + parts.join('/'))
    if (!target) return `cd: ${path}: No such file or directory`
    if (target.type !== 'dir') return `cd: ${path}: Not a directory`
    this.cwd = parts
    return null
  }

  cat(path: string): { ok: true; content: string } | { ok: false; error: string } {
    const target = this.resolve(path.startsWith('/') || path.startsWith('~') ? path : this.cwdPath() + '/' + path)
    if (!target) return { ok: false, error: `cat: ${path}: No such file or directory` }
    if (target.type === 'dir') return { ok: false, error: `cat: ${path}: Is a directory` }
    return { ok: true, content: target.content ?? '' }
  }

  mkdir(name: string): string | null {
    const parentPath = this.cwdPath()
    const parent = this.resolve(parentPath)
    if (!parent || parent.type !== 'dir') return `mkdir: cannot create directory '${name}'`
    if (parent.children?.find(c => c.name === name)) return `mkdir: cannot create directory '${name}': File exists`
    parent.children = parent.children ?? []
    parent.children.push(makeDir(name, [], { owner: 'user' }))
    return null
  }

  touch(name: string): string | null {
    const parent = this.resolve(this.cwdPath())
    if (!parent || parent.type !== 'dir') return `touch: cannot touch '${name}'`
    if (!parent.children?.find(c => c.name === name)) {
      parent.children = parent.children ?? []
      parent.children.push(makeFile(name, '', { owner: 'user' }))
    }
    return null
  }

  rm(name: string, recursive = false): string | null {
    const parent = this.resolve(this.cwdPath())
    if (!parent || parent.type !== 'dir' || !parent.children) return `rm: cannot remove '${name}'`
    const idx = parent.children.findIndex(c => c.name === name)
    if (idx === -1) return `rm: cannot remove '${name}': No such file or directory`
    const node = parent.children[idx]
    if (!node) return `rm: cannot remove '${name}'`
    if (node.type === 'dir' && !recursive) return `rm: cannot remove '${name}': Is a directory (use -r)`
    parent.children.splice(idx, 1)
    return null
  }

  pwd(): string {
    return this.cwdPath()
  }

  autocomplete(partial: string): string[] {
    const parent = this.resolve(this.cwdPath())
    if (!parent || !parent.children) return []
    return parent.children
      .filter(c => c.name.startsWith(partial))
      .map(c => c.name + (c.type === 'dir' ? '/' : ''))
  }
}
