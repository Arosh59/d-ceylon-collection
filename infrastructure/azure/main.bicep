targetScope = 'resourceGroup'

@description('Azure region for the managed container environment.')
param location string = resourceGroup().location

@description('A globally unique resource prefix.')
param prefix string

resource environment 'Microsoft.App/managedEnvironments@2024-03-01' = {
  name: '${prefix}-environment'
  location: location
  tags: {
    'dceylon.release-ready': 'requires-approved-observability-config'
  }
}

output managedEnvironmentId string = environment.id
output releaseGuidance string = 'Deploy API, web, admin, and AI containers through an approved pipeline with Key Vault references; do not put secrets in Bicep parameters.'
