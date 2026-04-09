const fs = require('fs');
let txt = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const regex = /import \{\s*BarChart,\s*Bar,\s*XAxis,\s*YAxis,\s*Tooltip,\s*ResponsiveContainer,[\s\S]*?rt,\s*Line,\s*PieChart,\s*Pie,\s*Cell,\s*AreaChart,\s*Area\s*\} from 'recharts';/m;

const replacement = import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';;

txt = txt.replace(regex, replacement);
fs.writeFileSync('src/pages/Admin.tsx', txt);
