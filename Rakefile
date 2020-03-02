# frozen_string_literal: true

require 'bundler'
Bundler.require

require 'rake/clean'

require 'pp'
require 'json'
require 'open3'

CLOBBER << '_site'

directory '_data'

directory '_data/build_settings'
CLEAN << '_data/build_settings'

task default: %i[xcspec strings]

task build: [:default] do
  sh %(JEKYLL_ENV=production bundle exec jekyll build --trace)
  sh %(tidy -m -w 0 -i --hide-comments yes --tidy-mark no -ashtml -q _site/index.html)
end

task deploy: [:build] do
  sh %(netlify deploy --prod -d _site)
end

task xcspec: ['_data/build_settings'] do |t|
  Dir['/Applications/Xcode.app/Contents/PlugIns/Xcode3Core.ideplugin/**/*.xcspec'].each do |path|
    next unless json = plutil_to_json(path)
    next unless options = json['Options']

    name = canonicalize(json['Name'])

    filename = File.join(t.source, normalize(name)) + '.json'
    build_settings = begin
                         JSON.parse(File.read(filename))['build_settings']
                     rescue StandardError
                       {}
                       end

    description = json['Description']

    options.each do |option|
      next unless option_name = option['Name']
      next unless option_name.match?(/^(?!_)[A-Z_]+/)

      build_settings[option_name] ||= {}

      build_settings[option_name]['description'] = option['Description']
      build_settings[option_name]['type'] = option['Type']
      build_settings[option_name]['default_value'] = option['DefaultValue']
      build_settings[option_name]['category'] = option['Category']
      build_settings[option_name]['values'] = option['Values']
      build_settings[option_name]['command_line_arguments'] = option['CommandLineArgs']
    end

    # puts path, name

    next if build_settings.empty?

    json = {
      name: name,
      description: description,
      build_settings: build_settings
    }.to_json

    File.write(filename, json)
    # rescue => error
    #     puts path, error
    #     next
  end
end

task strings: ['_data/build_settings'] do |t|
  Dir['/Applications/Xcode.app/Contents/PlugIns/Xcode3Core.ideplugin/**/*.strings'].each do |path|
    plist = CFPropertyList::List.new(file: path)
    strings = CFPropertyList.native_types(plist.value)
    next unless strings

    name = canonicalize(strings['Name'] || File.basename(path, '.*'))
    description = strings['Description']

    filename = File.join(t.source, normalize(name)) + '.json'
    build_settings = begin
                       JSON.parse(File.read(filename))['build_settings']
                     rescue StandardError
                       {}
                     end

    strings.each do |key, value|
      case key
      when /^\[(.+)\]-name$/i
        build_settings[Regexp.last_match(1)] ||= {}
        build_settings[Regexp.last_match(1)]['name'] = value
      when /^\[(.+)\]-description$/i
        build_settings[Regexp.last_match(1)] ||= {}
        build_settings[Regexp.last_match(1)]['description'] = value
      when /^\[(.+)\]-description-\[(.+)\]$/i
        build_settings[Regexp.last_match(1)] ||= {}
        build_settings[Regexp.last_match(1)]['values'] ||= {}
        if build_settings[Regexp.last_match(1)]['values'].is_a?(Array)
          build_settings[Regexp.last_match(1)]['values'] = {}
        end
        build_settings[Regexp.last_match(1)]['values'][Regexp.last_match(2)] = value
      end
    end

    next if build_settings.empty?

    # puts path, name

    json = {
      name: name,
      description: description,
      build_settings: build_settings
    }.to_json

    File.write(filename, json)
  end
end

private

def plutil_to_json(path)
  input = File.read(path)
  command = ['plutil', '-convert', 'json', '-', '-o', '-'].join(' ')
  output, error = Open3.capture3(command, stdin_data: input)
  json = begin
           JSON.parse(output)
         rescue StandardError
           nil
         end

  case json
  when Hash
    json
  when Array
    json.first
  end
end

def canonicalize(name)
  case name
  when 'Ld' then 'Link Executables'
  when 'StripSymbols' then 'Strip Symbols'
  when 'Libtool' then 'Create Static Library'
  when 'PBXCp' then 'Source Versioning'
  when 'TextBasedAPITool' then 'Text-Based API Tool'

  when 'SwiftBuildSettings' then 'Swift Build Settings'

  when 'Apple Clang' then 'Clang'
  when 'Cpp' then 'C++ Preprocessor'
  when /Interface Builder/
    name.gsub(/Interface Builder/, '').strip
  when 'Compile RC Project' then 'Reality Composer Project Compiler'
  when 'Compile Skybox' then 'ARKit Skybox Compiler'
  when 'Compile USDZ' then 'USDZ Compiler'
  when 'Intent Definition' then 'Siri Intent Definition Compiler'
  when 'Process SceneKit Document' then 'SceneKit Document Processor'
  when 'OSACompile' then 'OSA Compiler'
  else
    name
  end
end

def normalize(name)
  return unless name

  name.gsub(/[\s\.\(\)\-]+/, '')
end
