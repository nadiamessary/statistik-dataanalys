addMdToPage(`## Depression`);
addMdToPage(`Påverkar faktorer som familjens historik av psykisk ohälsa, och är självmordstankar vanligare hos de som både lider av depression och har denna familjehistorik? Ser det olika ut bland män och kvinnor? Låt oss ta en närmre titt`);

let genderFilter = addDropdown("Kön", ["Alla", "Män", "Kvinnor"], "Alla");

let genderWhere = "";
if (genderFilter === "Män") genderWhere = "AND Gender = 1";
else if (genderFilter === "Kvinnor") genderWhere = "AND Gender = 2";

let totalStudents = await dbQuery(`SELECT COUNT(*) AS total FROM depressionIndia WHERE 1=1 ${genderWhere}`);
let totalDepressed = await dbQuery(`SELECT COUNT(*) AS depressed FROM depressionIndia WHERE Depression = 1 ${genderWhere}`);
let totalNotDepressed = totalStudents[0].total - totalDepressed[0].depressed;

let familyDepressed = await dbQuery(`SELECT COUNT(*) AS count FROM depressionIndia WHERE Depression = 1 AND FamilyOfMentalIllness = 1 ${genderWhere}`);
let familyNotDepressed = await dbQuery(`SELECT COUNT(*) AS count FROM depressionIndia WHERE Depression = 0 AND FamilyOfMentalIllness = 1 ${genderWhere}`);

let suicidalDepressed = await dbQuery(`SELECT COUNT(*) AS count FROM depressionIndia WHERE Depression = 1 AND HaveYouEverHadSuicidalThoughts = 1 ${genderWhere}`);
let suicidalNotDepressed = await dbQuery(`SELECT COUNT(*) AS count FROM depressionIndia WHERE Depression = 0 AND HaveYouEverHadSuicidalThoughts = 1 ${genderWhere}`);

let depressedAndFamilySuicidal = await dbQuery(`SELECT COUNT(*) AS count FROM depressionIndia WHERE Depression = 1 AND FamilyOfMentalIllness = 1 AND HaveYouEverHadSuicidalThoughts = 1 ${genderWhere}`);
let notDepressedAndFamilySuicidal = await dbQuery(`SELECT COUNT(*) AS count FROM depressionIndia WHERE Depression = 0 AND FamilyOfMentalIllness = 1 AND HaveYouEverHadSuicidalThoughts = 1 ${genderWhere}`);

function percent(val) {
  return `${(Math.round(1000 * val) / 10).toFixed(1)}%`;
}

let depressionStats = [{
  Grupp: "Deprimerade studenter",
  "Av alla studenter": percent(totalDepressed[0].depressed / totalStudents[0].total),
  "Psykisk ohälsa i familjen": percent(familyDepressed[0].count / totalDepressed[0].depressed),
  "Självmordstankar": percent(suicidalDepressed[0].count / totalDepressed[0].depressed),
  "Psykisk ohälsa i familjen & självmordstankar": percent(depressedAndFamilySuicidal[0].count / totalDepressed[0].depressed)
}, {
  Grupp: "Icke-deprimerade studenter",
  "Av alla studenter": percent(totalNotDepressed / totalStudents[0].total),
  "Psykisk ohälsa i familjen": percent(familyNotDepressed[0].count / totalNotDepressed),
  "Självmordstankar": percent(suicidalNotDepressed[0].count / totalNotDepressed),
  "Psykisk ohälsa i familjen & självmordstankar": percent(notDepressedAndFamilySuicidal[0].count / totalNotDepressed)
}];

tableFromData({
  data: depressionStats,
  columnNames: Object.keys(depressionStats[0])
});

let depressionChartData = [
  {
    Faktor: "Psykisk ohälsa i familjen",
    Deprimerade: parseFloat(depressionStats[0]["Psykisk ohälsa i familjen"]),
    IckeDeprimerade: parseFloat(depressionStats[1]["Psykisk ohälsa i familjen"])
  },
  {
    Faktor: "Självmordstankar",
    Deprimerade: parseFloat(depressionStats[0]["Självmordstankar"]),
    IckeDeprimerade: parseFloat(depressionStats[1]["Självmordstankar"])
  },
  {
    Faktor: "Psykisk ohälsa i familjen & självmordstankar",
    Deprimerade: parseFloat(depressionStats[0]["Psykisk ohälsa i familjen & självmordstankar"]),
    IckeDeprimerade: parseFloat(depressionStats[1]["Psykisk ohälsa i familjen & självmordstankar"])
  }
];

drawGoogleChart({
  type: 'ColumnChart',
  data: makeChartFriendly(depressionChartData, 'Faktor', 'Deprimerade', 'Inte deprimerade'),
  options: {
    title: `Psykisk ohälsa och självmordstankar - ${genderFilter}`,
    hAxis: { title: "Faktor" },
    vAxis: { title: "Andel (%)" },
    colors: ['#6a0dad', '#ff8c00'],
    height: 400
  }
});
addMdToPage(`Resultaten skiljer sig inte nämnvärt mellan kön.
  <br><br>Man brukar säga att depression är en av de absolut dödligaste sjukdomarna, och enligt resultatet ovan tampas majoriteten av de som är deprimerade även med självmord - hela 85%. Detta är oroande och kan vara är en indikator för allvarlighetsgraden av psykisk ohälsa bland studenter i Indien. 
  <br><br>Psykisk ohälsa i familjen verkar i sig inte vara en faktor för depression, även om studenter med psykisk ohälsa i familjen visar små tendenser till att vara mer deprimerade än de som inte har psykisk ohälsa i familjen. `);