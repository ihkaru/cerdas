
import { databaseService } from '../database/DatabaseService';

export function useDatabase() {
    return {
        init: async () => await databaseService.init(),
        getDB: async () => await databaseService.getDB(),
        save: async () => await databaseService.save(),
        reset: async () => await databaseService.resetDatabase(),
    };
}
