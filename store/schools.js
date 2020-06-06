import { addSchool, getSchools } from "~/models/Schools";
export const state = () => ({
  schools: [],
});

export const getters = {
  getSchools(state) {
    return state.schools;
  },
  getActiveSchool(state) {
    return state.schools.find((s) => s.active);
  },
};

export const mutations = {
  addSchool(state, school) {
    state.school.push(school);
  },
  setSchools(state, schools) {
    state.schools = schools;
  },
  updateSchool(state, newData) {
    const idx = state.schools.findIndex((s) => s.active);
    const activeSchool = state.schools[idx];
    state.schools.splice(idx, 1, {
      ...activeSchool,
      ...newData,
    });
  },
};

export const actions = {
  getAllSchools({ commit, getters }) {
    if (getters["isAuthenticated"]) {
      getSchools.then((schools) => {
        commit("setSchools", schools);
      });
    }
  },
  createSchool({ commit, getters }, data) {
    if (getters["isAuthenticated"]) {
      addSchool(data).then((resp) => {
        commit("addSchool", resp);
      });
    } else {
      // Do localStoragenewSemester
      const latestSchoolId =
        [...getters["getSchools"]].sort((a, b) => a.id - b.id).pop().id || 0;
      const newSemester = {
        ...data,
        id: isNaN(latestSchoolId) ? 0 : parseInt(latestSchoolId) + 1,
      };
      commit("addSchool", newSemester);
    }
  },
  updateSchoolScale({ commit, getters }, scale) {
    const currentSchool = getters["getActiveSchool"];
    const newData = {
      ...currentSchool,
      scale: scale,
    };
    if (getters["isAuthenticated"]) {
      // Change
    } else {
      // Do localStorage
      commit("updateSchool", newData);
    }
  },
  updateSchoolName({ commit, getters }, name) {
    const currentSchool = getters["getActiveSchool"];
    const newData = {
      ...currentSchool,
      name: name,
    };
    if (getters["isAuthenticated"]) {
      // Change
    } else {
      // Do localStorage
      commit("updateSchool", newData);
    }
  },
};

export default {
  state,
  actions,
  mutations,
  getters,
};
