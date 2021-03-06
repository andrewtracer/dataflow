"""
Core class definitions
"""

from . import config
from .deps import processing_order

_registry = {}
def register_instrument(instrument):
    """
    Add a new instrument to the server.
    """
    config.INSTRUMENTS.append(instrument.id)
    for m in instrument.modules:
        register_module(m)
def register_module(module):
    """
    Register a new calculation module.
    """
    if module.id in _registry and module != _registry[module.id]:
        raise ValueError("Module already registered")
    _registry[module.id] = module
def lookup_module(id):
    """
    Lookup a module in the registry.
    """
    return _registry[id]


class Module(object):
    """
    Processing module

    A computation is represented as a set of modules connected by wires.

    Attributes
    ----------

    id : string

        Module identifier. By convention this will be a dotted structure
        '<operation>.<instrument class>.<instrument>', with instrument
        optional for generic operations.

    version : string

        Version number of the code which implements the filter calculation.
        If the calculation changes, the version number should be incremented.

    name : string

        The display name of the module.  This may appear in the user interface
        in addition to any pictorial representation of the module.  Usually it
        is just the name of the operation.  By convention, it should have
        every word capitalized, with spaces between words.

    description : string

        A tooltip shown when hovering over the icon

    icon : { URI: string, terminals: { string: [x,y,i,j] } }

        Image representing the module, or none if the module should be
        represented by name.

        The terminal locations are identified by:

        id : string
        
            name of the terminal
    
        position : [int, int]
        
            (x,y) location of terminal within icon

        direction : [int, int]
    
            direction of the wire as it first leaves the terminal;
            default is straight out
    

    fields : Form

        An inputEx form defining the constants needed for the module.  For
        example, an attenuator will have an attenuation scalar.  Field
        names must be distinct from terminal names.

    terminals : [Terminal]

        List module inputs and outputs.

        id : string
    
            name of the variable associated with the data
    
        datatype : string
    
            name of the datatype associated with the data, with the
            output of one module needing to match the input of the
            next.  Using a hierarchical type system, such as
            data1d.refl, we can attach to generic modules like scaling
            as well as specific modules like footprint correction.  By
            defining the type of data that flows through the terminal
            we can highlight valid connections automatically.

        use : string | "in|out"
        
            whether this is an input parameter or an output parameter
        
        description : string
    
            A tooltip shown when hovering over the terminal; defaults
            to datatype name
    
        required : boolean
    
            true if an input is required; ignored on output terminals.
    
        multiple : boolean
    
            true if multiple inputs are accepted; ignored on output
            terminals.
    """
    def __init__(self, id, version, name, description, icon=None,
                 terminals=None, fields=None, action=None):
        self.id = id
        self.version = version
        self.name = name
        self.description = description
        self.icon = icon
        self.fields = fields
        self.terminals = terminals
        self.action = action

class Template(object):
    """
    A template captures the computational workflow as a wiring diagram.

    Attributes
    ----------

    name : string
    
        String identifier for the template

    version : string

        Version number of the template

    description : string
    
        Extended description to be displayed as help to the template user.
    
    instrument : string
    
        Instrument to which the template applies

    modules : [TemplateModule]

        Modules used in the template
        
        module : string
    
            module id for template node

        version : string

            version number of the module

        config : map
    
            initial values for the fields
    
        position : [int,int]
    
            location of the module on the canvas.

    wires : [TemplateWire]

        Wires connecting the modules
        
        source : [int, string]
    
            module id in template and terminal name in module
    
        target : [int, string]
    
            module id in template and terminal name in module
        
    """
    def __init__(self, name, description, modules, wires, instrument,
                 version='0.0'):
        self.name = name
        self.description = description
        self.modules = modules
        self.wires = wires
        self.instrument = instrument
        self.version = version

    def order(self):
        """
        Return the module ids in processing order.
        """
        pairs = [(w['source'][0], w['target'][0]) for w in self.wires]
        return processing_order(len(self.modules), pairs)

    def __iter__(self):
        """
        Yields module#, inputs for each module in the template in order.
        """
        for id in self.order():
            inputs = [w for w in self.wires if w['target'][0] == id]
            yield id, inputs

    def __getstate__(self):
        """
        Version aware pickler.  Returns (version, state)
        """
        return '1.0', self.__dict__
    def __setstate__(self, state):
        """
        Version aware unpickler.  Expects (version, state)
        """
        version, state = state
        if version != '1.0':
            raise TypeError('Template definition mismatch')
        self.__dict__ = state

class Instrument(object):
    """
    An instrument is a set of modules and standard templates to be used
    for reduction

    Attributes
    ----------

    id : string

        Instrument identifier.  By convention this will be a dotted
        structure '<facility>.<instrument class>.<instrument>'

    name : string

        The display name of the instrument

    menu : [(string, [Module, ...]), ...]
    
        Modules available.  Modules are organized into groups of related
        operations, such as Input, Reduce, Analyze, ...

    datatypes : [Datatype]
    
        List of datatypes used by the instrument
        
    archive : URI
    
        Location of the data archive for the instrument.  Archives must
        implement an interface that allows data sets to be listed and
        retrieved for a particular instrument/experiment.
    """
    def __init__(self, id, name=None, menu=None,
                 datatypes=None, requires=None, archive=None):
        self.id = id
        self.name = name
        self.menu = menu
        self.datatypes = datatypes
        self.requires = requires
        self.archive = archive

        self.modules = []
        for _, m in menu:
            self.modules.extend(m)
        self._check_datatypes()
        self._check_names()

    def _check_datatypes(self):
        defined = set(d.id for d in self.datatypes)
        used = set()
        for m in self.modules:
            used |= set(t['datatype'] for t in m.terminals)
        if used - defined:
            raise TypeError("undefined types: %s" % ", ".join(used - defined))
        if defined - used:
            raise TypeError("unused types: %s" % ", ".join(defined - used))

    def _check_names(self):
        names = set(m.name for m in self.modules)
        if len(names) != len(self.modules):
            raise TypeError("names must be unique within an instrument")
        
    def id_by_name(self, name):
        for m in self.modules:
            if m.name == name: return m.id
        raise KeyError(name + ' does not exist in instrument ' + self.name)

class Datatype(object):
    """
    A datatype

    Attributes
    ----------

    id : string

        simple name for the data type

    name : string

        display name for the data type

    plot : string

        javascript code to set up a plot of the data, or empty if
        data is not plottable
    
    
    """
    def __init__(self, id, name=None, plot=None):
        self.id = id
        self.name = name if name is not None else id.capitalize()
        self.plot = plot
        
class Data(object):
    """
    Data objects represent the information flowing over a wire.

    Attributes
    ----------

    name : string
    
        User visible identifier for the data.  Usually this is file name.

    datatype : string
    
        Type of the data.  This determines how the data may be plotted
        and filtered.
    
    intent : string
    
        What role the data is intended for, such as 'background' for
        data that is used for background subtraction.

    dataid : string
    
        Key to the data. The data itself can be stored and retrieved by key.

    history : list

        History is the set of modules used to create the data.  Each module
        is identified by the module id, its version number and the module
        configuration used for this data set.  For input terminals, the
        configuration will be {string: [int,...]} identifying
        the connection between nodes in the history list for each input.

        module : string

        version : string

        inputs : { <input terminal name> : [(<hist iindex>, <output terminal>), ...] }

        config : { <field name> : value, ... }
        
        dataid : string

    """
    
    def __getstate__(self):
        return "1.0", __dict__
    def __setstate__(self, state):
        version, state = state
        self.__dict__ = state


