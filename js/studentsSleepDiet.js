addMdToPage("## Diet- och sömnvanor");
addMdToPage(`De flesta har upplevt hur ens hälsovanor påverkar ens humör, men hur stor påverkan har egentligen diet- och sömnvanor på den psykiska ohälsan bland studenter i Indien?<br><br>`);
let dietaryDep = await dbQuery(`
  SELECT DietaryHabits AS category, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM depressionIndia WHERE Depression = 1), 1) AS percent
  FROM depressionIndia
  WHERE Depression = 1
  GROUP BY DietaryHabits
`);

let dietaryNotDep = await dbQuery(`
  SELECT DietaryHabits AS category, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM depressionIndia WHERE Depression = 0), 1) AS percent
  FROM depressionIndia
  WHERE Depression = 0
  GROUP BY DietaryHabits
`);

addMdToPage("## Dietvanor");
addMdToPage("<b>1</b> = hälsosam, <b>2</b> = medel, <b>3</b> = ohälsosam");

tableFromData({
  data: [1, 2, 3].map(cat => ({
    Kategori: cat,
    Deprimerade: (dietaryDep.find(x => x.category == cat) || {}).percent + "%" || "0%",
    IckeDeprimerade: (dietaryNotDep.find(x => x.category == cat) || {}).percent + "%" || "0%"
  })),
  columnNames: ["Dietkategori", "Deprimerade", "Inte deprimerade"]
});

let dietChartData = [1, 2, 3].map(cat => ({
  Dietkategori: cat === 1 ? "Hälsosam" : cat === 2 ? "Medel" : "Ohälsosam",
  Deprimerade: (dietaryDep.find(x => x.category == cat) || {}).percent || 0,
  IckeDeprimerade: (dietaryNotDep.find(x => x.category == cat) || {}).percent || 0
}));

drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(dietChartData, 'Dietkategori', 'Deprimerade', 'Inte deprimerade'),
  options: {
    title: 'Depressionsförekomst baserat på diet',
    hAxis: { title: 'Diet' },
    vAxis: { title: 'Andel (%)' },
    colors: ['#6a0dad', '#ff8c00'],
    height: 400
  }
});
addMdToPage(`Vi kan se stora skillnader i fördelningen av deprimerade som äter hälsosamt och ohälsosamt: det verkar som att vi kan dra slutsatsen att ju mer ohälsosam kost, desto större risk för depression.
<br><br>En viktig fundering är dock "vad är en hälsosam diet?". Många personer tror att de äter hälsosamt fastän de egentligen inte gör det. Är det en faktor som skulle kunna påverka resultatet så att vi egentligen borde se en ännu lägre andel deprimerade som har en hälsosam diet?`);

let sleepDep = await dbQuery(`
  SELECT SleepDuration AS category, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM depressionIndia WHERE Depression = 1), 1) AS percent
  FROM depressionIndia
  WHERE Depression = 1
  GROUP BY SleepDuration
`);

let sleepNotDep = await dbQuery(`
  SELECT SleepDuration AS category, ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM depressionIndia WHERE Depression = 0), 1) AS percent
  FROM depressionIndia
  WHERE Depression = 0
  GROUP BY SleepDuration
`);

addMdToPage("## Sömnvanor");
addMdToPage("<b>5</b> = mindre än 5h/natt, <b>6</b> = 6–7h/natt, <b>7</b> = 7–8h/natt, <b>8</b> = mer än 8h/natt");

tableFromData({
  data: [5, 6, 7, 8].map(cat => ({
    Sömntimmar: cat,
    Deprimerade: (sleepDep.find(x => x.category == cat) || {}).percent + "%" || "0%",
    IckeDeprimerade: (sleepNotDep.find(x => x.category == cat) || {}).percent + "%" || "0%"
  })),
  columnNames: ["Sömnkategori", "Deprimerade", "Inte deprimerade"]
});

let sleepChartData = [5, 6, 7, 8].map(cat => ({
  Sömn: cat === 5 ? "<5h" : cat === 6 ? "6–7h" : cat === 7 ? "7–8h" : ">8h",
  Deprimerade: (sleepDep.find(x => x.category == cat) || {}).percent || 0,
  IckeDeprimerade: (sleepNotDep.find(x => x.category == cat) || {}).percent || 0
}));

drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(sleepChartData, 'Sömn', 'Deprimerade', 'Inte deprimerade'),
  options: {
    title: 'Depressionsförekomst baserat på sömnvanor',
    hAxis: { title: 'Antal sömntimmar/natt' },
    vAxis: { title: 'Andel (%)', minValue: 0 },
    colors: ['#6a0dad', '#ff8c00'],
    height: 400
  }
});
addMdToPage("Bland de studenter som har hälsosamma sömnvanor (mellan 6 och 8 timmar per natt) är fördelningen relativt jämn mellan deprimerade och icke-deprimerade.<br><br>I ändorna av sömnskalan är skillnaderna desto större: studenter som sover färre än 5 timmar är i större grad deprimerade - det är ovanligt att deprimerade sover i mer än 8 timmar per natt.");


let unhealthyShortSleepData = await dbQuery(`
  SELECT 
    SUM(CASE WHEN Depression = 1 THEN 1 ELSE 0 END) AS deprimerade,
    SUM(CASE WHEN Depression = 0 THEN 1 ELSE 0 END) AS ickedeprimerade
  FROM depressionIndia
  WHERE DietaryHabits = 3 AND SleepDuration = 5
`);

let totalComboStudents = unhealthyShortSleepData[0].deprimerade + unhealthyShortSleepData[0].ickedeprimerade;

if (totalComboStudents > 0) {
  let pieChartData = [
    { Status: "Deprimerade", Andel: Math.round(1000 * unhealthyShortSleepData[0].deprimerade / totalComboStudents) / 10 },
    { Status: "Inte deprimerade", Andel: Math.round(1000 * unhealthyShortSleepData[0].ickedeprimerade / totalComboStudents) / 10 }
  ];

  addMdToPage("## Ohälsosam diet och dålig sömn i kombination");
  addMdToPage("Vi har sett att studenter med ohälsosamma dietvanor verkar vara mer deprimerade, likaså för studenterna med dålig sömn. Därför är det intressant att titta på hur det ser ut för studenter som både sagt sig ha ohälsosam diet och dålig sömn.");

  drawGoogleChart({
    type: 'PieChart',
    data: makeChartFriendly(pieChartData, 'Status', 'Andel'),
    options: {
      title: "Ohälsosam diet och dålig sömn i kombination",
      colors: ['#6a0dad', '#ff8c00'],
      height: 400
    }
  });
}

  addMdToPage("Resultatet här är talande: av de som både har ohälsosam diet och sover dåligt är en klar majoritet deprimerade. För att bryta trenden av psykisk ohälsa behöver studenterna sova mer och äta bättre!");