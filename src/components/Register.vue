<template>
  <div>

    <auth-form
      action="register"
      v-on:process="register($event)"
    />

    <app-snack-bar
      v-if="snackBar"
      :snack-bar="snackBar"
      :text="message"
      :timeout="timeout"
    />
  </div>
</template>

<script>
	import AppSnackBar from "@/components/SnackBar";
  import AuthForm from "@/forms/Auth";
  import {db} from '@/main';
  export default {
		name: "Register",
    components: {AuthForm, AppSnackBar},
    data () {
		  return {
		    snackBar: false,
        message: '',
        timeout: 5000
      }
    },
    methods: {
		  register (user) {
		    this.$store.dispatch('firebaseRegister', user)
          .then((cred) => {
            const data = {
              uid: cred.user.uid,
              email: user.email,
              role: 'customer'
            };
            //Copy uid from firebase to firestore collection
            db.collection('users').doc(cred.user.uid).set(data).then(() => {
              this.$store.commit('setRole', data.role);
              this.$router.push('/');
            });
          })
          .catch((error) => {
            this.message = error.message;//.substr(0, 60);
            this.snackBar = true;
            setTimeout(() => {
              this.snackBar = false;
            }, this.timeout);
          })
      }
    }
  }
</script>
