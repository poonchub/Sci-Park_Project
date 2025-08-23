import { create } from "zustand";
import { UserInterface } from "../interfaces/IUser";

interface UserStore {
    user: UserInterface | null;
    setUser: (user: UserInterface) => void;
}

export const useUserStore = create<UserStore>((set) => ({
    user: null,
    
    setUser: (user) => set({ user }),
}));