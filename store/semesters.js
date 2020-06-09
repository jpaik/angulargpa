import { addSemester, getSemesters, deleteSemester } from "~/models/Semesters";

export const state = () => ({
  semesters: [],
});
export const getters = {
  getSemesters: (state) => state.semesters,
  getSemestersForSchool: (state, getters, rootState, rootGetters) => (
    schoolId
  ) => {
    if (rootGetters["isAuthenticated"]) {
      return state.semesters.filter((s) => s.school.value.id === schoolId);
    } else {
      return state.semesters.filter((s) => s.school === schoolId);
    }
  },
  getSemesterById: (state) => (id) => state.semesters.find((s) => s.id === id),
  getActiveSemester: (state, getters, rootState, rootGetters) => {
    const active = state.semesters.find((s) => s.active);
    if (active) {
      return active;
    } else {
      const activeSchool = rootGetters["schools/getActiveSchool"];
      if (activeSchool) {
        return getters["getSemestersForSchool"](activeSchool.id)[0];
      }
    }
  },
  getCreditsForSemester: (state, getters, rootState, rootGetters) => (id) => {
    const classes = rootGetters["classes/getClassesForSemester"](id);
    if (classes) {
      return classes.reduce(
        (sum, c) => (c.credits ? parseInt(c.credits) + sum : sum),
        0
      );
    }
    return 0;
  },
};
export const mutations = {
  addSemester(state, newSemester) {
    state.semesters.push(newSemester);
  },
  setSemesters(state, semesters) {
    state.semesters = semesters;
  },
  updateSemester(state, newData) {
    const idx = state.semesters.findIndex((s) => newData.id === s.id);
    const semester = state.semesters[idx];
    state.semesters.splice(idx, 1, {
      ...semester,
      ...newData,
    });
  },
  deleteSemester(state, id) {
    if (state.semesters.length > 1) {
      const idx = state.semesters.findIndex((s) => id === s.id);
      state.semesters.splice(idx, 1);
    }
  },
  deleteAll(state) {
    state.semesters = [];
  },
};
export const actions = {
  getSemestersForSchool({ commit, rootGetters }, schoolId) {
    if (rootGetters["isAuthenticated"]) {
      console.log("Get Semesters for School");
      return getSemesters(this.$faunaClient(), schoolId).then((semesters) => {
        commit("setSemesters", semesters);
      });
    }
  },
  /**
   *
   * @param {*} data expects school and rest of data
   */
  createSemester({ commit, getters, rootGetters, dispatch }, schoolId) {
    const activeSchoolId =
      schoolId || rootGetters["schools/getActiveSchool"].id;
    const semesterData = {
      name: "",
      school: activeSchoolId,
      active: false,
    };
    if (rootGetters["isAuthenticated"]) {
      addSemester(this.$faunaClient(), activeSchoolId, semesterData).then(
        (resp) => {
          commit("addSemester", resp);
        }
      );
    } else {
      // Do localStorage
      let latestSemesters = [
        ...getters["getSemestersForSchool"](activeSchoolId),
      ];
      let latestSemesterId = 0;
      if (latestSemesters.length) {
        latestSemesterId = latestSemesters
          .sort((a, b) => a.id.split("_").pop() - b.id.split("_").pop())
          .pop().id || [0];
        latestSemesterId = parseInt(latestSemesterId.split("_").pop());
      }
      const newSemester = {
        ...semesterData,
        id: activeSchoolId + "_" + (latestSemesterId + 1),
      };
      commit("addSemester", newSemester);
      dispatch("classes/createClass", newSemester.id, { root: true });
      dispatch("triggerSaving", null, { root: true });
    }
  },
  deleteSemester({ commit, rootGetters, dispatch }, semesterId) {
    if (rootGetters["isAuthenticated"]) {
      deleteSemester(this.$faunaClient(), semesterId).then((resp) => {
        commit("deleteSemester", resp);
      });
    } else {
      // Do localStorage
      commit("deleteSemester", semesterId);
      dispatch("classes/deleteClassesForSemester", semesterId, {
        root: true,
      });
      dispatch("triggerSaving", null, { root: true });
    }
  },
  updateActiveSemester({ commit, getters, rootGetters }, semesterId) {
    const currentSemester = getters["getActiveSemester"];
    const changeCurrentActive = {
      ...currentSemester,
      active: false,
    };
    const newActive = getters["getSemesterById"](semesterId);
    const changeNewActive = {
      ...newActive,
      active: true,
    };
    if (rootGetters["isAuthenticated"]) {
      // Change
    } else {
      // Do localStorage
      if (currentSemester) {
        commit("updateSemester", changeCurrentActive);
      }
      commit("updateSemester", changeNewActive);
    }
  },
  updateSemesterName(
    { commit, getters, dispatch, rootGetters },
    { semesterId, newName }
  ) {
    const toUpdate = getters["getSemesterById"](semesterId);
    const toUpdateData = {
      ...toUpdate,
      name: newName,
    };
    if (rootGetters["isAuthenticated"]) {
      // Change
    } else {
      // Do localStorage
      commit("updateSemester", toUpdateData);
      dispatch("triggerSaving", null, { root: true });
    }
  },
  clearData({ commit }) {
    return commit("deleteAll");
  },
};

export default {
  state,
  actions,
  mutations,
  getters,
};
