"use server" 

import * as auth from "@/auth";

export async function signInGoogle(provider : string) {

        return auth.signIn("google");

}
export async function signInGit(provider:string) {
    return auth.signIn("github");
}