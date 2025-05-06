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
addMdToPage("Utifrån grafen ovan verkar det som att vi kan dra slutsatsen att ju mer ohälsosam kost, desto större risk för depression.");

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
addMdToPage("Det verkar inte som att antal sömntimmar har större påverkan på depression hos indiska studenter förutom i ändarna på sömntimmarna: av de som sover färre än 5 timmar per natt är en majoritet deprimerade och bland de som sover fler än 8 timmar per natt är majoriteten inte deprimerad.");