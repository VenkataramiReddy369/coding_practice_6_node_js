const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error :${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

const convertDbObjectTOResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};
const convertDistrictObjectToResponseObject = (dbObject) => {
  return {
    districtId: dbObject.district_id,
    districtName: dbObject.district_name,
    stateId: dbObject.state_id,
    cases: dbObject.cases,
    cured: dbObject.cured,
    active: dbObject.active,
    deaths: dbObject.deaths,
  };
};

// API 1
app.get("/states/", async (request, response) => {
  const selectStatesQuery = `
    select 
    * from
    state
    ;`;
  const statesArray = await db.all(selectStatesQuery);
  response.send(convertDbObjectTOResponseObject(statesArray));
});

// API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const selectStateQuery = `
  select *
  from
  state
  where state_id = ${stateId};`;
  const stateArray = await db.get(selectStateQuery);
  response.send(convertDbObjectTOResponseObject(stateArray));
});

// API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const createDistrictQuery = `
INSERT INTO district(district_name,state_id,cases,cured,active,deaths)
VALUES(
    '${districtName}',
    ${stateId},
    ${cases},
    ${cured},
    ${active},
    ${deaths}
    );`;
  const createDistrict = await db.run(createDistrictQuery);
  response.send("District Successfully Added");
});

// API 4

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
  select
  * from
  district
  where district_id = ${districtId};`;
  const district = await db.get(getDistrictQuery);
  response.send(convertDistrictObjectToResponseObject(district));
});

// API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDeleteQuery = `
  DELETE 
  FROM
  district
  where district_id = ${districtId};`;
  const deleteQuery = await db.run(getDeleteQuery);
  response.send("District Removed");
});

// API 6
app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE district
    SET
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    where district_id = ${districtId};`;
  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

// API 7
app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStatsQuery = `
  SELECT
  SUM(cases),
  SUM(cured),
  SUM(active),
  SUM(deaths)
  from district
  where state_id = ${stateId};`;
  const stats = await db.get(getStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

// API 8
app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    select state_id from district
    where district_id = ${districtId};
    `;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
    select state_name as stateName from state
    where state_id = ${getDistrictIdQueryResponse.state_id};
    `;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});
module.exports = app;
