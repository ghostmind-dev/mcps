# variables.tf

variable "PORT" {
  type      = string
  sensitive = true
}

variable "SERVER_TOKEN" {
  type      = string
  sensitive = true
}

variable "GITHUB_TOKEN" {
  type      = string
  sensitive = true
}

variable "ENVIRONMENT" {
  type      = string
  sensitive = true
}

variable "SERVER_URL" {
  type      = string
  sensitive = true
}

variable "IMAGE_DIGEST_DEFAULT" {
  type      = string
  sensitive = true
}

variable "PROJECT" {
  type      = string
  sensitive = true
}

variable "APP" {
  type      = string
  sensitive = true
}

variable "GCP_PROJECT_ID" {
  type      = string
  sensitive = true
}


locals {
  env_vars = [
    {
      name  = "SERVER_TOKEN"
      value = var.SERVER_TOKEN
    },
    {
      name  = "GITHUB_TOKEN"
      value = var.GITHUB_TOKEN
    },
    {
      name  = "ENVIRONMENT"
      value = var.ENVIRONMENT
    },
    {
      name  = "SERVER_URL"
      value = var.SERVER_URL
    },
    {
      name  = "IMAGE_DIGEST_DEFAULT"
      value = var.IMAGE_DIGEST_DEFAULT
    },
    {
      name  = "PROJECT"
      value = var.PROJECT
    },
    {
      name  = "APP"
      value = var.APP
    },
    {
      name  = "GCP_PROJECT_ID"
      value = var.GCP_PROJECT_ID
    }
  ]
}

  
