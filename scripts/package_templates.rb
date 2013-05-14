#!/usr/bin/env ruby -w

# Recursively searches the 'templates/' directory, reads in and minifies each template,
# then writes it to the TEMPLATE_FILE as JavaScript.

TEMPLATE_FILE = 'AppTemplates.js'
JS_TEMPLATE_OBJ = 'DIT'

# Strip out whitespace indentation, newlines, and condense whitespace between tags.
def minify(template)
  template.gsub(/^\s+/, '').gsub(/\n/, ' ').gsub(/>\s*</, '> <')
end

dynamo_dir = File.join(File.dirname(__FILE__), '..')
File.open(File.join(dynamo_dir, TEMPLATE_FILE), 'w') do |f|
  f.write "#{JS_TEMPLATE_OBJ} = {};\n"
  template_dir = File.expand_path(File.join(dynamo_dir, 'templates'))
  Dir[File.join(template_dir, '**/*._template')].each do |t|
    path = t.gsub(/#{template_dir}\//, '').gsub(/\._template$/, '')
    f.write "#{JS_TEMPLATE_OBJ}[\"#{path}\"] = '#{minify(IO.read(t))}';\n"
  end
end