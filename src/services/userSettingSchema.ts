import { COMMAND_MAX } from '@/const'

export default {
  title: 'UserSettingSchema',
  type: 'object',
  required: ['startupMethod', 'commands', 'popupPlacement', 'style'],
  properties: {
    startupMethod: {
      $id: '#/startupMethod',
      $ref: '#/definitions/startupMethod',
    },
    popupPlacement: {
      $id: '#/popupPlacement',
      $ref: '#/definitions/popupPlacement',
    },
    style: {
      $id: '#/style',
      type: 'string',
      default: 'vertical',
      enum: ['vertical', 'horizontal'],
    },
    commands: {
      type: 'array',
      minItems: 1,
      maxItems: COMMAND_MAX,
      items: {
        $ref: '#/definitions/command',
      },
    },
    linkCommand: {
      type: 'object',
      required: ['threshold', 'showIndicator'],
      additionalProperties: false,
      properties: {
        threshold: {
          name: 'Threshold',
          $id: '#/linkCommand/threshold',
          type: 'number',
          default: 150,
          minimum: 50,
          maximum: 400,
          step: 10,
        },
        showIndicator: {
          name: 'ShowIndicator',
          $id: '#/linkCommand/showIndicator',
          type: 'boolean',
          default: true,
        },
      },
    },
    folders: {
      type: 'array',
      items: {
        $ref: '#/definitions/commandFolder',
      },
    },
    pageRules: {
      type: 'array',
      items: {
        type: 'object',
        required: ['urlPattern', 'popupEnabled', 'popupPlacement'],
        additionalProperties: false,
        properties: {
          urlPattern: {
            type: 'string',
          },
          popupEnabled: {
            type: 'string',
            enum: ['Enable', 'Disable'],
            default: 'Enable',
          },
          popupPlacement: {
            $ref: '#/definitions/popupPlacement',
          },
          linkCommandEnabled: {
            type: 'string',
            enum: ['Enable', 'Disable'],
            default: 'Enable',
          },
        },
      },
    },
    userStyles: {
      type: 'array',
      items: {
        $ref: '#/definitions/styleVariable',
      },
    },
  },
  definitions: {
    popupPlacement: {
      type: 'string',
      default: 'top-end',
      enum: [
        'top',
        'top-start',
        'top-end',
        'bottom',
        'bottom-start',
        'bottom-end',
      ],
    },
    startupMethod: {
      type: 'object',
      name: 'StartupMethod',
      additionalProperties: false,
      required: ['method'],
      properties: {
        method: {
          $id: '#/startupMethod/method',
          $ref: '#/definitions/startupMethodEnum',
          default: 'textSelection',
        },
      },
      dependencies: {
        method: {
          oneOf: [
            {
              properties: {
                method: {
                  enum: ['textSelection'],
                },
              },
            },
            {
              properties: {
                method: {
                  enum: ['contextMenu'],
                },
              },
            },
            {
              properties: {
                method: {
                  enum: ['keyboard'],
                },
                keyboardParam: {
                  $id: '#/startupMethod/param/keyboard',
                  type: 'string',
                  enum: ['Control', 'Alt', 'Shift'],
                  default: 'Control',
                },
              },
              required: ['keyboardParam'],
            },
            {
              properties: {
                method: {
                  enum: ['leftClickHold'],
                },
                leftClickHoldParam: {
                  $id: '#/startupMethod/param/leftClickHold',
                  type: 'number',
                  minimum: 50,
                  maximum: 500,
                  step: 10,
                  default: 200,
                },
              },
              required: ['leftClickHoldParam'],
            },
          ],
        },
      },
    },
    command: {
      type: 'object',
      name: 'Command',
      required: ['title', 'iconUrl', 'openMode'],
      additionalProperties: false,
      properties: {
        title: {
          type: 'string',
        },
        openMode: {
          $id: '#/commands/openMode',
          $ref: '#/definitions/openMode',
          default: 'popup',
        },
        iconUrl: {
          $id: '#/commands/iconUrl',
          type: 'string',
        },
        parentFolderId: {
          $id: '#/commands/parentFolderId',
          $ref: '#/definitions/folderOptions',
        },
      },
      dependencies: {
        openMode: {
          oneOf: [
            {
              properties: {
                openMode: {
                  enum: ['popup'],
                },
                openModeSecondary: {
                  $id: '#/commands/openModeSecondary_popup',
                  $ref: '#/definitions/openModeSecondary',
                  default: 'tab',
                },
                searchUrl: {
                  type: 'string',
                },
                spaceEncoding: {
                  $id: '#/commands/spaceEncoding_popup',
                  $ref: '#/definitions/spaceEncoding',
                },
                popupOption: {
                  $ref: '#/definitions/popupOption',
                },
              },
              required: ['searchUrl', 'popupOption'],
            },
            {
              properties: {
                openMode: {
                  enum: ['tab'],
                },
                openModeSecondary: {
                  $id: '#/commands/openModeSecondary_tab',
                  $ref: '#/definitions/openModeSecondary',
                  default: 'tab',
                },
                searchUrl: {
                  type: 'string',
                },
                spaceEncoding: {
                  $id: '#/commands/spaceEncoding_tab',
                  $ref: '#/definitions/spaceEncoding',
                },
              },
              required: ['searchUrl'],
            },
            {
              properties: {
                openMode: {
                  enum: ['api'],
                },
                searchUrl: {
                  type: 'string',
                },
                fetchOptions: {
                  $id: '#/commands/fetchOptions',
                  type: 'string',
                },
                variables: {
                  type: 'array',
                  items: {
                    $ref: '#/definitions/commandVariable',
                  },
                },
              },
              required: ['searchUrl', 'fetchOptions', 'variables'],
            },
            {
              properties: {
                openMode: {
                  enum: ['linkPopup'],
                },
                title: {
                  type: 'string',
                  default: 'Link Popup',
                },
                iconUrl: {
                  type: 'string',
                  default:
                    'https://cdn3.iconfinder.com/data/icons/fluent-regular-24px-vol-5/24/ic_fluent_open_24_regular-1024.png',
                },
              },
            },
            {
              properties: {
                openMode: {
                  enum: ['copy'],
                },
                copyOption: {
                  $id: '#/commands/copyOption',
                  type: 'string',
                  enum: ['default', 'text'],
                  default: 'default',
                },
                title: {
                  type: 'string',
                  default: 'Copy text',
                },
                iconUrl: {
                  type: 'string',
                  default:
                    'https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-2/256/copy-light-1024.png',
                },
              },
              required: ['copyOption'],
            },
            {
              properties: {
                openMode: {
                  enum: ['getTextStyles'],
                },
                title: {
                  type: 'string',
                  default: 'Get Text Styles',
                },
                iconUrl: {
                  type: 'string',
                  default:
                    'https://cdn0.iconfinder.com/data/icons/phosphor-light-vol-3/256/paint-brush-light-1024.png',
                },
              },
            },
          ],
        },
      },
    },
    commandFolder: {
      type: 'object',
      name: 'Folder',
      required: ['title'],
      additionalProperties: false,
      properties: {
        id: {
          type: 'string',
        },
        title: {
          type: 'string',
        },
        iconUrl: {
          $id: '#/commandFolder/iconUrl',
          type: 'string',
          default:
            'https://cdn4.iconfinder.com/data/icons/basic-ui-2-line/32/folder-archive-document-archives-fold-512.png',
        },
        onlyIcon: {
          name: 'OnlyIcon',
          $id: '#/commandFolder/onlyIcon',
          type: 'boolean',
        },
      },
    },
    popupOption: {
      type: 'object',
      required: ['width', 'height'],
      additionalProperties: false,
      properties: {
        width: {
          type: 'number',
          default: 600,
        },
        height: {
          type: 'number',
          default: 700,
        },
      },
    },
    folderOptions: {
      enumNames: [''],
      enum: [
        {
          id: '',
          name: '',
        },
      ],
    },
    openMode: {
      type: 'string',
      enum: [''],
    },
    openModeSecondary: {
      type: 'string',
      enum: ['popup', 'tab'],
    },
    startupMethodEnum: {
      type: 'string',
      enum: [''],
    },
    spaceEncoding: {
      type: 'string',
      default: 'plus',
      enum: ['plus', 'percent'],
    },
    commandVariable: {
      type: 'object',
      name: 'Variable',
      required: ['name', 'value'],
      additionalProperties: false,
      properties: {
        name: {
          type: 'string',
        },
        value: {
          type: 'string',
        },
      },
    },
    styleVariable: {
      $id: '#/styleVariable',
      type: 'object',
      name: 'styleVariable',
      required: ['name', 'value'],
      properties: {
        name: {
          type: 'string',
          enum: [''],
        },
        value: {
          type: 'string',
        },
      },
    },
  },
}
