export class User {
    id: string;
    name: string;
    email: string;
    password?: string; // Made optional
    isAdmin: boolean;
    acceptedRules?: boolean;
    acceptedRulesAt?: string | null;
    acceptedRulesVersion?: string | null;

    constructor(id: string, name: string, email: string, isAdmin: boolean = false, password?: string, acceptedRules?: boolean, acceptedRulesAt?: string | null, acceptedRulesVersion?: string | null) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.password = password;
        this.isAdmin = isAdmin;
        this.acceptedRules = acceptedRules;
        this.acceptedRulesAt = acceptedRulesAt;
        this.acceptedRulesVersion = acceptedRulesVersion;
    }

}