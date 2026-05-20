export class User {
    id: string;
    name: string;
    email: string;
    password?: string; // Made optional
    isAdmin: boolean;
    
    constructor(id: string, name: string, email: string, isAdmin: boolean = false, password?: string) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.isAdmin = isAdmin;
    }
}