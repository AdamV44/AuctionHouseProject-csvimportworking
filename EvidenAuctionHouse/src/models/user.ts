export class User {
    id: string;
    name: string;
    email: string;
    password: string;
    isAdmin: boolean;
    
    constructor(id: string, name: string, email: string, password: string, isAdmin: boolean = false) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.isAdmin = isAdmin;
    }
}