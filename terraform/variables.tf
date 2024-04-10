variable "resource_group_name" {
  default = "rg-frontend-sand-ne-001"
}

variable "resource_group_location" {
  default = "northeurope"
}

variable "azurerm_resource_group_apim_name" {
  default = resource_group_name
}