import axios from "axios";

class StatsPort {
    BASE_PATH = "/stats";
    getTopAssociations(limit) {
        const query = { limit };

        const path = `${this.BASE_PATH}/associations`;
        return axios
            .get(path, {
                params: query,
            })
            .then(result => {
                if (result.data.message) throw new Error(result.data.message);
                return result.data.data;
            });
    }

    getMonthlyUserCount(year) {
        const path = `${this.BASE_PATH}/users/monthly/${year}`;
        return axios.get(path).then(result => {
            if (result.data.message) throw new Error(result.data.message);
            return result.data.data;
        });
    }

    getUsersDistribution() {
        const path = `${this.BASE_PATH}/users/status`;
        return axios.get(path).then(result => {
            if (!result.data.data) throw new Error(result.data.message);
            return result.data.data;
        });
    }

    getMonthlyVisitCount(year) {
        // TODO update route (and test?)
        const path = `${this.BASE_PATH}/visits/monthly/${year}`;
        return axios.get(path).then(result => {
            if (result.data.message) throw new Error(result.data.message);
            return result.data;
        });
    }
}

const statsPort = new StatsPort();
export default statsPort;
