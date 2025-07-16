# openvpn-connection

GitHub Action that connects to an OpenVPN gateway

# Usage

```yaml
name: Deploy to server
on: [release]
jobs:
  openvpn-connection:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Connect to OpenVPN
        uses: leukeleu/openvpn-connection@v2
        with:
          ovpn_config: ${{ secrets.OVPN_CONFIG }}
          ovpn_username: ${{ secrets.OVPN_USERNAME }}
          ovpn_password: ${{ secrets.OVPN_PASSWORD }}

      - name: Run deployment script
        run: |
          echo "Running deployment script..."
          # Add your deployment commands here
```

The VPN connection will be closed automatically at the end of the job.

# Inputs

- `ovpn_config`: The OpenVPN configuration file content. This should be stored as a secret in your GitHub repository.
  The config should contain all the necessary settings and credentials (execpt username/password) to connect to the OpenVPN server.
- `ovpn_username`: The username for OpenVPN authentication. This should also be stored as a secret.
- `ovpn_password`: The password for OpenVPN authentication. This should be stored as a secret.

