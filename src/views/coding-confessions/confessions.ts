export interface Confession {
  text: string
  tag?: string
}

export const confessions: Confession[] = [
  {
    text: 'Toi da tung debug 4 tieng lien... vi quen save file.',
    tag: 'classic',
  },
  {
    text: 'Toi copy code tu Stack Overflow ma khong hieu no lam gi. No chay. Toi khong dam dong vao.',
    tag: 'Stack Overflow',
  },
  {
    text: 'Moi lan fix xong bug, toi deu tu hoi: "Lam sao no chay duoc truoc do?"',
    tag: 'bug',
  },
  {
    text: 'Toi viet comment "// TODO: fix later" tu 2 nam truoc. Van chua fix.',
    tag: 'TODO',
  },
  {
    text: 'Toi da tung git push --force len main. Vao luc 2h sang. Mot minh.',
    tag: 'git',
  },
  {
    text: 'Khach hang noi "chi can thay doi nho thoi" — toi biet ngay la se mat ca tuan.',
    tag: 'khach hang',
  },
  {
    text: '"No chay tren may toi ma" la cau toi noi nhieu nhat trong doi dev.',
    tag: 'classic',
  },
  {
    text: 'Toi dat ten bien la "temp" roi quen doi. Bay gio code day nhung "temp2", "temp3", "tempFinal".',
    tag: 'naming',
  },
  {
    text: 'Toi da tung console.log("here") o 47 cho khac nhau de tim 1 cai bug.',
    tag: 'debug',
  },
  {
    text: 'Dong nghiep khen code toi sach. That ra toi vua refactor 5 phut truoc khi demo.',
    tag: 'review',
  },
  {
    text: 'Toi Google cach thoat Vim it nhat 1 lan moi thang.',
    tag: 'vim',
  },
  {
    text: 'Fix 1 bug, sinh ra 3 bug moi. Day la quy luat bat bien cua vu tru.',
    tag: 'bug',
  },
  {
    text: 'Toi doc lai code minh viet 6 thang truoc va tu hoi: "Ai viet cai nay?"',
    tag: 'code quality',
  },
  {
    text: 'Toi bao deadline la 2 tuan. That ra 3 ngay la xong. Nhung toi can thoi gian "buffer".',
    tag: 'deadline',
  },
  {
    text: 'Meeting nay co the gui email duoc ma. — Moi dev, moi ngay.',
    tag: 'meeting',
  },
  {
    text: 'Toi da tung viet if-else 15 tang. Roi tu nhu "se refactor sau". Chua bao gio refactor.',
    tag: 'code quality',
  },
  {
    text: 'ChatGPT viet code cho toi. Toi chi ngoi sua bug cua no. Vay toi la dev hay la QA?',
    tag: 'AI',
  },
  {
    text: 'Toi dat password la "123456" cho local database. Da 3 nam roi van chua doi.',
    tag: 'security',
  },
  {
    text: 'Deploy xong toi F5 lien tuc 20 lan de chac chan no khong loi.',
    tag: 'deploy',
  },
  {
    text: 'Toi noi "code nay chi la tam thoi" — 3 nam sau no van chay tren production.',
    tag: 'technical debt',
  },
  {
    text: 'README ghi "doc day du" nhung lan cuoi cap nhat la 2 nam truoc.',
    tag: 'docs',
  },
  {
    text: 'Toi da tung xoa ca database production vi chay nhom script sai moi truong.',
    tag: 'production',
  },
  {
    text: 'Moi khi ai do noi "don gian thoi" toi biet la se khong don gian chut nao.',
    tag: 'classic',
  },
  {
    text: 'Toi hoc duoc nhieu nhat tu viec doc code loi cua nguoi khac. Va cua chinh minh.',
    tag: 'learning',
  },
]
