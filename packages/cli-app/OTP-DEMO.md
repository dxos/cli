# App server auth with OTP

1. Go to CLI repo;
2. Checkout branch:

```
$ git pull && git checkout egorgripasov/app-server-cookie
```

3. Install & Build:

```
$ yarn && yarn build
```

4. Start app server:

```
$ yarn dx app serve
```

5. Open any app in browser, e.g. `http://localhost:5999/app/dxos:application/teamwork@alpha`

6. Follow link to 'Setup 2FA', or open `http://localhost:5999/auth/setup` in your browser;

7. Use 2FA app (e.g. Google Authenticator) - scan QR code to add new app;

8. Use code from 2FA app in `Password` field.
