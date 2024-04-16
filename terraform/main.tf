terraform {
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.92.0"
    }
  }

  required_version = ">= 1.1.0"
}

provider "azurerm" {
  features {}
}


resource "azurerm_resource_group" "azure_app" {
  name     = var.resource_group_name
  location = var.resource_group_location
}

resource "azurerm_storage_account" "azure_app_storage_account" {
  name     = "azureappne1"
  location = var.resource_group_location

  account_replication_type = "LRS"
  account_tier             = "Standard"
  account_kind             = "StorageV2"
  resource_group_name      = var.resource_group_name

  static_website {
    index_document = "index.html"
  }
}

resource "azurerm_storage_share" "azure_app" {
  name  = "fa-products-service-share"
  quota = 2

  storage_account_name = azurerm_storage_account.azure_app_storage_account.name
}

resource "azurerm_service_plan" "azure_app" {
  name     = "asp-product-service-sand-ne-001"
  location = var.resource_group_location

  os_type  = "Windows"
  sku_name = "Y1"

  resource_group_name = var.resource_group_name
}

resource "azurerm_application_insights" "azure_app" {
  name             = "appins-fa-products-service-sand-ne-001"
  application_type = "web"
  location         = var.resource_group_location

  resource_group_name = var.resource_group_name
}


resource "azurerm_windows_function_app" "azure_app" {
  name     = "azure-app-products-service-ne-001"
  location = var.resource_group_location

  service_plan_id     = azurerm_service_plan.azure_app.id
  resource_group_name = azurerm_resource_group.azure_app.name

  storage_account_name       = azurerm_storage_account.azure_app_storage_account.name
  storage_account_access_key = azurerm_storage_account.azure_app_storage_account.primary_access_key

  functions_extension_version = "~4"
  builtin_logging_enabled     = false

  site_config {
    always_on = false

    application_insights_key               = azurerm_application_insights.azure_app.instrumentation_key
    application_insights_connection_string = azurerm_application_insights.azure_app.connection_string

    # For production systems set this to false, but consumption plan supports only 32bit workers
    use_32_bit_worker = true

    # Enable function invocations from Azure Portal.
    cors {
      allowed_origins = ["https://portal.azure.com", "https://azureappne1.z16.web.core.windows.net", "https://apim-mgt-service-ne-003.azure-api.net", "https://azureappne1.z16.web.core.windows.net"
      ]
    }

    application_stack {
      node_version = "~16"
    }
  }

  app_settings = {
    WEBSITE_CONTENTAZUREFILECONNECTIONSTRING = azurerm_storage_account.azure_app_storage_account.primary_connection_string
    WEBSITE_CONTENTSHARE                     = azurerm_storage_share.azure_app.name
  }

  # The app settings changes cause downtime on the Function App. e.g. with Azure Function App Slots
  # Therefore it is better to ignore those changes and manage app settings separately off the Terraform.
  lifecycle {
    ignore_changes = [
      app_settings,
      site_config["application_stack"], // workaround for a bug when azure just "kills" your app
      tags["hidden-link: /app-insights-instrumentation-key"],
      tags["hidden-link: /app-insights-resource-id"],
      tags["hidden-link: /app-insights-conn-string"]
    ]
  }
}

resource "azurerm_app_configuration" "azure_app" {
  location            = var.resource_group_location
  name                = "azure-app-config"
  resource_group_name = azurerm_resource_group.azure_app.name

  sku = "standard"
}

resource "azurerm_api_management" "core_apim" {
  location        = "northeurope"
  name            = "apim-mgt-service-ne-003"
  publisher_email = "stanislau_piletski@epam.com"
  publisher_name  = "Stanislau Piletski"

  resource_group_name = var.azurerm_resource_group_apim_name
  sku_name            = "Consumption_0"
}

resource "azurerm_api_management_api" "products_api" {
  api_management_name = azurerm_api_management.core_apim.name
  name                = "products-service-api"
  resource_group_name = var.azurerm_resource_group_apim_name
  revision            = "1"

  display_name = "Products Service API"

  protocols = ["https"]
}

data "azurerm_function_app_host_keys" "products_keys" {
  name                = azurerm_windows_function_app.azure_app.name // azurerm_windows_function_app.products_service.name
  resource_group_name = var.azurerm_resource_group_apim_name
}

resource "azurerm_api_management_backend" "products_fa" {
  name                = "products-service-backend"
  resource_group_name = var.azurerm_resource_group_apim_name
  api_management_name = azurerm_api_management.core_apim.name
  protocol            = "http"
  url                 = "https://${azurerm_windows_function_app.azure_app.name}.azurewebsites.net/api"
  description         = "Products API"

  credentials {
    certificate = []
    query       = {}

    header = {
      "x-functions-key" = data.azurerm_function_app_host_keys.products_keys.default_function_key
    }
  }
}

resource "azurerm_api_management_api_policy" "api_policy" {
  api_management_name = azurerm_api_management.core_apim.name
  api_name            = azurerm_api_management_api.products_api.name
  resource_group_name = var.azurerm_resource_group_apim_name

  xml_content = <<XML
 <policies>
    <inbound>
        <set-backend-service backend-id="${azurerm_api_management_backend.products_fa.name}"/>
        <base/>
    </inbound>
    <backend>
        <base/>
    </backend>
    <outbound>
        <base/>
    </outbound>
    <on-error>
        <base/>
    </on-error>
 </policies>
XML
}

resource "azurerm_api_management_api_operation" "get_products" {
  api_management_name = azurerm_api_management.core_apim.name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Get Products"
  method              = "GET"
  operation_id        = "get-products"
  resource_group_name = var.azurerm_resource_group_apim_name
  url_template        = "/products"
}

resource "azurerm_api_management_api_operation" "get_product_by_id" {
  operation_id        = "get-product-by-id"
  api_management_name = azurerm_api_management.core_apim.name
  api_name            = azurerm_api_management_api.products_api.name
  display_name        = "Get Product by Id"
  method              = "GET"
  resource_group_name = var.azurerm_resource_group_apim_name
  url_template        = "/products/{id}"

  template_parameter {
    name     = "id"
    type     = "number"
    required = true
  }
}
