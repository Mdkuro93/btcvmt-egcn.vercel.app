const fs = require('fs');
let code = fs.readFileSync('src/App.tsx', 'utf8');

const regexes = [
  {
    find: `\\{loanPieData && loanPieData.length > 0 \\? \\(<div className="h-\\[250px\\] w-full">\\n                         <ResponsiveContainer width="100%" height=\\{250\\}>\\n                            <BarChart data=\\{loanPieData\\}>`,
    replace: `<div className="h-[250px] w-full">\n                         <ResponsiveContainer width="100%" height={250}>\n                            <BarChart data={loanPieData}>`
  },
  {
    find: `</BarChart>\\n                         </ResponsiveContainer>\\n                      </div>\\) : <div className="h-\\[250px\\] w-full flex items-center justify-center"><span className="text-xs text-slate-500 italic">Chưa có dữ liệu</span></div>\\}\\n                   </div>\\n\\n                </div>\\n                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">`,
    replace: `</BarChart>\n                         </ResponsiveContainer>\n                      </div>\n                   </div>\n\n                </div>\n                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">`
  },
  {
    find: `\\{stats && stats.length > 0 \\? \\(<div className="h-\\[350px\\] w-full">\\n                         <ResponsiveContainer width="100%" height=\\{350\\}>\\n                            <BarChart data=\\{stats\\} layout="vertical" margin=\\{\\{ left: 20 \\}\\}>`,
    replace: `<div className="h-[350px] w-full">\n                         <ResponsiveContainer width="100%" height={350}>\n                            <BarChart data={stats} layout="vertical" margin={{ left: 20 }}>`
  },
  {
    find: `</BarChart>\\n                         </ResponsiveContainer>\\n                      </div>\\) : <div className="h-\\[350px\\] w-full flex items-center justify-center"><span className="text-xs text-slate-500 italic">Chưa có dữ liệu</span></div>}\\n                   </div>\\n\\n                   <div className=\\{cn\\(`,
    replace: `</BarChart>\n                         </ResponsiveContainer>\n                      </div>\n                   </div>\n\n                   <div className={cn(`
  },
  {
    find: `\\{stats && stats.length > 0 \\? \\(<div className="h-\\[350px\\] w-full">\\n                         <ResponsiveContainer width="100%" height=\\{350\\}>\\n                            <BarChart data=\\{stats\\.slice\\(\\)\\.sort\\(\\s*\\(a:any,\\s*b:any\\)\\s*=>\\s*a\\.avgTime - b\\.avgTime\\)\\} layout="vertical" margin=\\{\\{ left: 20 \\}\\}>`,
    replace: `<div className="h-[350px] w-full">\n                         <ResponsiveContainer width="100%" height={350}>\n                            <BarChart data={stats.slice().sort((a:any, b:any) => a.avgTime - b.avgTime)} layout="vertical" margin={{ left: 20 }}>`
  },
  {
    find: `</BarChart>\\n                         </ResponsiveContainer>\\n                      </div>\\) : <div className="h-\\[350px\\] w-full flex items-center justify-center"><span className="text-xs text-slate-500 italic">Chưa có dữ liệu</span></div>\\}\\n                   </div>\\n                </div>`,
    replace: `</BarChart>\n                         </ResponsiveContainer>\n                      </div>\n                   </div>\n                </div>`
  },
  {
    find: `\\{slaStats && slaStats.length > 0 \\? \\(<div className="h-\\[400px\\] w-full">\\n                       <ResponsiveContainer width="100%" height=\\{400\\}>\\n                        <BarChart data=\\{slaStats\\} layout="vertical" margin=\\{\\{ left: 20 \\}\\}>`,
    replace: `<div className="h-[400px] w-full">\n                       <ResponsiveContainer width="100%" height={400}>\n                        <BarChart data={slaStats} layout="vertical" margin={{ left: 20 }}>`
  },
  {
    find: `</BarChart>\\n                       </ResponsiveContainer>\\n                    </div>\\n                    \\) : <div className="h-\\[400px\\] w-full flex items-center justify-center"><span className="text-xs text-slate-500 italic">Chưa có dữ liệu</span></div>\\}\\n                 </div>`,
    replace: `</BarChart>\n                       </ResponsiveContainer>\n                    </div>\n                 </div>`
  }
];

// Apply safely
for (let patch of regexes) {
  let re = new RegExp(patch.find);
  if (re.test(code)) {
    code = code.replace(re, patch.replace);
  }
}

fs.writeFileSync('src/App.tsx', code);
console.log('Reverted App.tsx charts!');
