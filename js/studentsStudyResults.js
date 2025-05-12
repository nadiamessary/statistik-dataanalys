let depressionPerDegree = await dbQuery(`
  SELECT 
    Degree, 
    COUNT(*) AS total, 
    ROUND(100.0 * SUM(Depression) / COUNT(*), 1) AS depressionRate
  FROM depressionIndia
  GROUP BY Degree
  ORDER BY Degree
`);

addMdToPage("## Utbildning och depression");
addMdToPage("<b>0</b> = Grundskola, <b>1</b> = Gymnasieexamen, <b>2</b> = Kandidatexamen, <b>3</b> = Masterexamen, <b>4</b> = Läkarexamen, <b>5</b> = Doktorsexamen");

tableFromData({
  data: depressionPerDegree.map(row => ({
    "Utbildningsnivå": row.Degree,
    "Antal studenter": row.total,
    "Procent deprimerade": `${row.depressionRate}%`
  })),
  columnNames: ["Utbildningsnivå", "Antal studenter", "Procent deprimerade"]
});


drawGoogleChart({
  type: 'LineChart',
  data: makeChartFriendly(
    depressionPerDegree.map(row => ({
      Utbildningsnivå: row.Degree,
      "Depression (%)": row.depressionRate
    })),
    'Utbildningsnivå', 'Depression (%)'
  ),
  options: {
    title: "Depression bland olika utbildningsnivåer",
    hAxis: { title: "Utbildningsnivå" },
    vAxis: { title: "Andel deprimerade (%)", minValue: 0 },
    colors: ['#6a0dad'],
    curveType: 'function',
    pointSize: 6,
    pointShape: 'circle',
    height: 400
  }
});

addMdToPage("Genom att titta på studenternas olika utbildningsnivå ser vi att förekomsten av depression verkar vara lägre ju högre utbildning man har. Kan det vara så att man finner större glädje i livet genom att ägna sig åt högre studier?");

let degreeNames = {
  0: "Grundskola",
  1: "Gymnasieexamen",
  2: "Kandidatexamen",
  3: "Masterexamen",
  4: "Läkarexamen",
  5: "Doktorsexamen"
};

let degreeOptions = Object.entries(degreeNames).map(([value, label]) => `${value} = ${label}`);
let selected = addDropdown("Välj utbildningsnivå", degreeOptions, degreeOptions[0]);
let selectedDegree = parseInt(selected.split(" = ")[0]);

addMdToPage(`## ${degreeNames[selectedDegree]}`);

async function drawComparisonChart(title, columnName, hAxisTitle) {
  let totalStudentsDegree = await dbQuery(`
    SELECT COUNT(*) AS total
    FROM depressionIndia
    WHERE Degree = ${selectedDegree}
  `);

  let depressed = await dbQuery(`
    SELECT ${columnName} AS level, COUNT(*) AS count
    FROM depressionIndia
    WHERE Degree = ${selectedDegree} AND Depression = 1
    GROUP BY ${columnName}
    ORDER BY ${columnName}
  `);

  let notDepressed = await dbQuery(`
    SELECT ${columnName} AS level, COUNT(*) AS count
    FROM depressionIndia
    WHERE Degree = ${selectedDegree} AND Depression = 0
    GROUP BY ${columnName}
    ORDER BY ${columnName}
  `);

  let total = totalStudentsDegree[0].total;

  let levels = [1, 2, 3, 4, 5];
  let combinedData = levels.map(level => ({
    [hAxisTitle]: level,
    Deprimerade: Math.round(1000 * (depressed.find(x => x.level == level)?.count || 0) / total) / 10,
    IckeDeprimerade: Math.round(1000 * (notDepressed.find(x => x.level == level)?.count || 0) / total) / 10
  }));

  drawGoogleChart({
    type: 'ColumnChart',
    data: makeChartFriendly(combinedData, hAxisTitle, 'Deprimerade', 'Inte deprimerade'),
    options: {
      title,
      hAxis: { title: hAxisTitle },
      vAxis: { title: "Andel (%)", minValue: 0 },
      colors: ['#6a0dad', '#ff8c00'],
      height: 400
    }
  });
}

let cgpaData = await dbQuery(`
  SELECT 
    Degree,
    CASE 
      WHEN CGPA BETWEEN 0 AND 6 THEN 'Lågt (<6)'
      WHEN CGPA BETWEEN 6 AND 8 THEN 'Medel (6–8)'
      ELSE 'Högt (>8)'
    END AS CGPAKategori,
    COUNT(*) AS antalDeprimerade
  FROM depressionIndia
  WHERE Depression = 1
  GROUP BY Degree, CGPAKategori
  ORDER BY Degree, CGPAKategori
`);

let kategorier = ['Lågt (<6)', 'Medel (6–8)', 'Högt (>8)'];

function drawCgpaChartForSelectedDegree() {
  let totalDegreeStudents = depressionPerDegree.find(x => x.Degree == selectedDegree)?.total || 1;

  let currentData = kategorier.map(kat => {
    const match = cgpaData.find(x => x.Degree == selectedDegree && x.CGPAKategori == kat);
    return {
      CGPA: kat,
      Andel: match ? Math.round(1000 * match.antalDeprimerade / totalDegreeStudents) / 10 : 0
    };
  });

  drawGoogleChart({
    type: 'ColumnChart',
    data: makeChartFriendly(currentData, 'CGPA', 'Andel'),
    options: {
      title: `CGPA bland deprimerade – ${degreeNames[selectedDegree]}`,
      hAxis: { title: "CGPA-nivå" },
      vAxis: { title: "Andel deprimerade (%)", minValue: 0 },
      colors: ['#6a0dad'],
      height: 400
    }
  });
}

await drawComparisonChart("Akademisk press – deprimerade vs. icke-deprimerade", "AcademicPressure", "Akademisk press (1–5)");
addMdToPage(`Oberoende av utbildningsgrad är akademisk press något som tycks påverka ens psykiska ohälsa. De som har hög akademisk press (från nivå 3 och uppåt) verkar vara mer deprimerade. <br><br>Dock ser resultatet lite annorlunda ut för studenter som inte har högre utbildning än grundskola. Det kan finnas många orsaker till detta: exempelvis lägre krav på studenter i grundskolan jämfört med universitetet, eller det faktum att offentliga grundskolor i Indien brukar vara gratis medan det kan kosta stora pengar att studera på universitetet. En sådan kostnadsfråga kan i sig vara en anledning till att man känner högre akademisk press som kan leda till depression.`);
drawCgpaChartForSelectedDegree();
addMdToPage(`När vi även tittar på betyg kan vi dra slutsatsen att antalet deprimerade ökar i takt med både högre studiepress och högre studieresultat.<br> Kan det vara så att de som har högre CGPA också har haft högre akademisk press vilket i sin tur har lett till ökad psykisk ohälsa?`);
