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

addMdToPage(`## Fördelningar för ${degreeNames[selectedDegree]}`);

async function drawComparisonChart(title, columnName, hAxisTitle) {
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

  let levels = [1, 2, 3, 4, 5];
  let combinedData = levels.map(level => ({
    [hAxisTitle]: level,
    Deprimerade: depressed.find(x => x.level == level)?.count || 0,
    IckeDeprimerade: notDepressed.find(x => x.level == level)?.count || 0
  }));

  drawGoogleChart({
    type: 'ColumnChart',
    data: makeChartFriendly(combinedData, hAxisTitle, 'Deprimerade', 'Inte deprimerade'),
    options: {
      title,
      hAxis: { title: hAxisTitle },
      vAxis: { title: "Antal studenter" },
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
  let currentData = kategorier.map(kat => {
    const match = cgpaData.find(x => x.Degree == selectedDegree && x.CGPAKategori == kat);
    return {
      CGPA: kat,
      Antal: match ? match.antalDeprimerade : 0
    };
  });

  drawGoogleChart({
    type: 'ColumnChart',
    data: makeChartFriendly(currentData, 'CGPA', 'Antal'),
    options: {
      title: `CGPA bland deprimerade – ${degreeNames[selectedDegree]}`,
      hAxis: { title: "CGPA-nivå" },
      vAxis: { title: "Antal deprimerade studenter" },
      colors: ['#6a0dad'],
      height: 400
    }
  });
}

await drawComparisonChart("Akademisk press – deprimerade vs. icke-deprimerade", "AcademicPressure", "Akademisk press (1–5)");
drawCgpaChartForSelectedDegree();
addMdToPage(`Antalet deprimerade ökar i takt med både högre studiepress och högre studieresultat. Kan det vara så att de som har högre CGPA har haft högre akademisk press vilket i sin tur har lett till ökad psykisk ohälsa?`);